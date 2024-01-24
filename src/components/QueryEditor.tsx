import React, { ChangeEvent } from 'react';
import { InlineField, TextArea } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

import './style.css';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const onKeyDown = (event: any) => {
    if (event.key === 'Tab') {
      const textarea = event.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '   ' + textarea.value.substring(end);
      textarea.focus();
      event.preventDefault()
    }
  };
  const onQueryTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...query, queryText: event.target.value });
  };

  const { queryText } = query;
  const numberOfLines = queryText? queryText.split('\n').length + 1 : 1;

  let lines = [];
  for (let i = 1; i <= numberOfLines; i++) {
    lines.push(i);
  }

  return (
    <div className="gf-form">
      <InlineField label="SPARQL query" labelWidth={16}>
        <div className="editor">
          <div className="line-numbers">
            { lines.map((i) => (<span key={i}></span>)) }
          </div>
          <TextArea className="lined" cols={75} onKeyDown={onKeyDown} onChange={onQueryTextChange} value={queryText || ''}/>
        </div>
      </InlineField>
    </div>
  );
}
