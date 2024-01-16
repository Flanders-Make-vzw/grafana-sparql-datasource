/* Copyright (C) 2023 Flanders Make - CodesignS */

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { isFetchError, getTemplateSrv } from '@grafana/runtime';
import { QueryEngine } from '@comunica/query-sparql';

import _ from 'lodash';

import { MyQuery, MyDataSourceOptions } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  engine: QueryEngine;
  source?: string;
  credentials?: string;
  context: any;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.source = instanceSettings.jsonData.source;
    this.credentials = instanceSettings.jsonData.credentials;
    this.context = { sources: [ { type: 'sparql', value: this.source } ], fetch: (input: any, options: any) => {
      if (this.credentials) {
        if (!options) { options = {}; }
        if (!options.headers) { options.headers = {} }
        if (!options.headers.authorization) { options.headers.authorization = 'Basic ' + this.credentials }
      }
      return fetch(input, options);
    }};
    this.engine = new QueryEngine();
  }

  async run(query: string, context: any, callback: Function) {
    return new Promise(async (resolve, reject) => {
      const bindingsStream = await this.engine.queryBindings(query, context);
      bindingsStream.on('error', err => { reject(err); });
      bindingsStream.on('end', resolve);
      bindingsStream.on('data', bindings => { callback(bindings); });
    });
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    let data = [];
    for (const target of options.targets) {
      let fields: Array<{ name: string, values: any[], type: FieldType }> = [];
      let fieldMap = new Map<string, any>();

      if (target.queryText) {
        const query = getTemplateSrv().replace(target.queryText, options.scopedVars);
        console.log(query);
        await this.run(query, this.context, (bindings: any[]) => {
          for (const [ key, value ] of bindings) {
            let field = fieldMap.get(key.value);
            if (field) {
              field.values.push(value.value);
            }
            else {
              fieldMap.set(key.value, { values: [ value.value ], type: FieldType.string });
            }
          }
        });
      }
      for (let [ key, value ] of fieldMap) {
        fields.push({ name: key, values: value.values, type: value.type });
      }
      const frame = new MutableDataFrame({
        refId: target.refId,
        fields: fields
      });
      data.push(frame);
    }
    return { data };
  }

  async testDatasource() {
    const defaultErrorMessage = 'Error when attempting to connect to the SPARQL source';
    try {
      await this.run('SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 1', this.context, () => {});
      return {
        status: 'success',
        message: 'Success',
      };
    }
    catch (err) {
      let message = defaultErrorMessage;
      if (_.isString(err)) {
        message = err;
      } else if (isFetchError(err)) {
        message = 'Fetch error: ' + (err.statusText ? err.statusText : defaultErrorMessage);
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message;
        }
      }
      return {
        status: 'error',
        message: message
      };
    }
  }

  async metricFindQuery(query: string, options?: any) {
    let values: any[] = [];

    await this.run(query, this.context, (bindings: any) => {
      if (bindings.has('value')) {
        values.push({ text: bindings.get('value').value });
      }
    });
    return values;
  }  
}

