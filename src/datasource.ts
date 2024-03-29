/* Copyright (C) 2023 Flanders Make - CodesignS */

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { isFetchError, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import { QueryEngine } from '@comunica/query-sparql';

import _ from 'lodash';

import { MyQuery, MyDataSourceOptions } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  url: string;
  source?: string;
  credentials?: string;
  proxy: boolean;
  context: any;
  engine: QueryEngine;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.url = instanceSettings.url!;
    this.source = instanceSettings.jsonData.source;
    this.credentials = instanceSettings.jsonData.credentials;
    this.proxy = instanceSettings.jsonData.proxy;
    this.context = { sources: [ { type: 'sparql', value: this.source } ], fetch: async (input: any, options: any) => {
      if (this.credentials) {
        if (!options) { options = {}; }
        if (!options.headers) { options.headers = {} }
        if (!options.headers.authorization) { options.headers.authorization = 'Basic ' + this.credentials }
      }
      if (this.proxy) {
        console.log('server-side request');
        const response = getBackendSrv().fetch({ method: 'POST', url: this.url + '/source', headers: options?.headers || {}, data: options.body });
        const value = await lastValueFrom(response);
        return new Response(JSON.stringify(value.data), { headers: value.headers });
      }
      else {
        console.log('client-side request');
        return fetch(input, options);
      }
    }};
    this.engine = new QueryEngine();
  }

  async run(query: string, context: any, callback: Function) {
    return new Promise(async (resolve, reject) => {
      try {
        const bindingsStream = await this.engine.queryBindings(query, context);
        bindingsStream.on('error', err => { reject(err); });
        bindingsStream.on('end', resolve);
        bindingsStream.on('data', bindings => { callback(bindings); });
      }
      catch (err) {
        reject(err);
      }
    });
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    let data = [];
    for (const target of options.targets) {
      let fields: Array<{ name: string, values: any[], type: FieldType }> = [];
      const results: any[] = [], selects: any[] = [];

      if (target.queryText) {
        const query = getTemplateSrv().replace(target.queryText, options.scopedVars);
        try {
          await this.run(query, this.context, (bindings: any[]) => {
            results.push(bindings);
            for (const b of bindings) {
              selects[b[0].value] = true;
            }
          });
        }
        catch (err) {
          console.log(err);
          throw err;
          return { data };
        }
      }

      const findValueInBindings = (bindings: any[], select: String) => {
        for (let [ key, value ] of bindings) {
          if (key.value === select) {
            return value.value;
          }
        }
        return null;
      };

      for (const s in selects) {
        let values = [];
        for (const bindings of results) {
          values.push(findValueInBindings(bindings, s));
        }
        fields.push({ name: s, values: values, type: FieldType.string });
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
      const value = (bindings.has('value') ? bindings.get('value').value : '')
      const metric = {
        text: (bindings.has('label') ? bindings.get('label').value : value),
        value: value
      }
        values.push(metric);
    });
    return values;
  }  
}

