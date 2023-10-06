/* Copyright (C) 2023 Flanders Make - CodesignS */

import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  queryText?: string;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  queryText: 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 1';
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  source?: string;
  credentials?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  username?: string;
  password?: string;
}
