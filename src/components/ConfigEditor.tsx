/* Copyright (C) 2023 Flanders Make - CodesignS */

import React, { ChangeEvent } from 'react';
import { Buffer } from 'buffer';
import { InlineField, Input, InlineSwitch } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const onSourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      source: event.target.value
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onProxyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      proxy: event.target.checked
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    secureJsonData.username = event.target.value;
    const jsonData = {
      ...options.jsonData,
      credentials: generateCredentials(secureJsonData.username, secureJsonData.password)
    };
    onOptionsChange({ ...options, jsonData, secureJsonData });
  };

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    secureJsonData.password = event.target.value;
    const jsonData = {
      ...options.jsonData,
      credentials: generateCredentials(secureJsonData.username, secureJsonData.password)
    };
    onOptionsChange({ ...options, jsonData, secureJsonData });
  };

  const generateCredentials = (username?: string, password?: string) => {
    const u = username? username.trim() : '';
    const p = password? password.trim() : '';
    return Buffer.from(u + ':' + p).toString('base64');
  }

  const { jsonData } = options;
  const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

  return (
    <div className="gf-form-group">
      <InlineField label="Source" labelWidth={12}>
        <Input
          onChange={onSourceChange}
          value={jsonData.source || ''}
          placeholder="SPARQL endpoint URL"
          width={40}
        />
      </InlineField>
      <InlineField label="Username" labelWidth={12}>
        <Input
          onChange={onUsernameChange}
          value={secureJsonData.username || ''}
          placeholder="(to generate authentication token)"
          width={40}
        />
      </InlineField>
      <InlineField label="Password" labelWidth={12}>
        <Input
          onChange={onPasswordChange}
          value={secureJsonData.password || ''}
          placeholder="(to generate authentication token)"
          width={40}
        />
      </InlineField>
      <InlineField label="Proxy" labelWidth={12}>
        <InlineSwitch
          onChange={onProxyChange}
          value={jsonData.proxy ?? false}
          transparent={false}
        />
      </InlineField>
    </div>
  );
}
