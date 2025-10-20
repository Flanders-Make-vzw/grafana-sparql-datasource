/* Copyright (C) 2023-2025 Flanders Make - CodesignS */

import React, { useCallback } from 'react';
import { css } from '@emotion/css';
import { CodeEditor, useStyles2 } from '@grafana/ui';
import { QueryEditorProps, GrafanaTheme2 } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

type ChangeOptions<T> = {
  propertyName: keyof T;
  runQuery: boolean;
};

type OnChangeType = (value: string) => void;

export function useChangeString(props: Props, options: ChangeOptions<MyQuery>): OnChangeType {
  const { onChange, onRunQuery, query } = props;
  const { propertyName, runQuery } = options;

  return useCallback(
    (value: string) => {
      if (!value) {
        return;
      }

      onChange({
        ...query,
        [propertyName]: value,
      });

      if (runQuery) {
        onRunQuery();
      }
    },
    [onChange, onRunQuery, query, propertyName, runQuery]
  );
}

export function QueryEditor(props: Props) {
  const { query, } = props;
  const styles = useStyles2(getStyles);

  const onQueryTextChange = useChangeString(props, { propertyName: 'queryText', runQuery: true });

  const { queryText } = query;
  const numberOfLines = queryText? queryText.split('\n').length + 1 : 1;

  let lines = [];
  for (let i = 1; i <= numberOfLines; i++) {
    lines.push(i);
  }

  return (
    <div className={styles.editor}>
      <CodeEditor
        height="200px"
        showLineNumbers={true}
        language="sparql"
        onBlur={onQueryTextChange}
        value={query.queryText || ''}
      />
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    editor: css`
      margin: ${theme.spacing(0, 0.5, 0.5, 0)};
    `,
  };
}
