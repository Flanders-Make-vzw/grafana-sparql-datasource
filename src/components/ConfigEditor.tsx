/* Copyright (C) 2023-2025 Flanders Make - CodesignS */

import React, { ChangeEvent } from 'react';
import { Buffer } from 'buffer';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { options } = props;
  const { jsonData } = options;
  const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

  const onOptionsChange = (opts: any) => {
    if (opts.jsonData?.username && opts.secureJsonData?.password) {
      opts.secureJsonData.bearer = Buffer.from(opts.jsonData.username + ':' + opts.secureJsonData.password).toString('base64');
      opts.basicAuth = true;
      opts.basicAuthUser = opts.jsonData.username;
    }
    props.onOptionsChange(opts);
  }

  const onSourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = { ...options.jsonData, source: event.target.value };
    onOptionsChange({ ...options, jsonData });
  };

  const onUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = { ...options.jsonData, username: event.target.value };
    onOptionsChange({ ...options, jsonData });
  };

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;
    secureJsonData.password = event.target.value;
    onOptionsChange({ ...options, secureJsonData });
  };

  return (
    <div className="gf-form-group">
      <InlineField label="Source" labelWidth={12}>
        <Input
          onChange={onSourceChange}
          value={jsonData?.source || ''}
          placeholder="SPARQL endpoint URL"
          width={40}
        />
      </InlineField>
      <InlineField label="Username" labelWidth={12}>
        <Input
          onChange={onUsernameChange}
          value={jsonData?.username || ''}
          placeholder="Basic authentication username"
          width={40}
        />
      </InlineField>
      <InlineField label="Password" labelWidth={12}>
        <SecretInput
          onChange={onPasswordChange}
          value={secureJsonData?.password || ''}
          placeholder="Basic authentication password"
          width={40}
          isConfigured={false}
          onReset={() => {}}
        />
      </InlineField>
    </div>
  );
}
