import Icon from '@ant-design/icons';
import { Button, Dropdown, Form, Menu, notification, Tag } from 'antd';
import Upload, { RcFile } from 'antd/lib/upload';
import isElectron from 'is-electron';
import React from 'react';
import { xconf, XConfKeys } from '../../../models/xconf.enum';
import { useStore } from '../../../stores/index';
import { useObserver, useLocalStore } from 'mobx-react';
import { FormLabelComponent } from '../../../modules/stitches/component';

declare const window: any;

window.xconf = xconf;

export const Keystore = (props: { setFormFiled: Function }) => {
  const { lang } = useStore();

  const store = useLocalStore(() => ({
    keystores: xconf.getConf(XConfKeys.KEYSTORES, {}),
    keyname: xconf.getConf(XConfKeys.LAST_USED_KEYSTORE_NAME, ''),
    clearSelected: () => {
      props.setFormFiled({ keystore: '' } as {
        [key: string]: string;
      });
      // Clear remember for last keystore used also.
      xconf.setConf(XConfKeys.LAST_USED_KEYSTORE_NAME, '');
      store.keyname = '';
    },
    deleteKeystore(keyname: string): boolean {
      const { keystores } = store;
      const newKeystores: { [index: string]: string } = {};
      Object.keys(keystores).forEach((name) => {
        if (name !== keyname) {
          newKeystores[name] = keystores[name];
        }
      });
      if (keyname === store.keyname) {
        this.clearSelected();
      }
      store.keystores = newKeystores;
      // Update keystores list
      xconf.setConf(XConfKeys.KEYSTORES, newKeystores);
      return true;
    },
    selectKeystore(keyname: string): boolean {
      const keystores = xconf.getConf<{ [index: string]: string }>(XConfKeys.KEYSTORES, {});
      if (keystores[keyname]) {
        store.keyname = keyname;
        props.setFormFiled({ keystore: store.keystores[keyname] } as {
          [key: string]: string;
        });
        xconf.setConf(XConfKeys.LAST_USED_KEYSTORE_NAME, keyname);
      }
      return true;
    },
    readFileStore: (file: RcFile) => {
      const { keystores } = store;
      const reader = new FileReader();
      // Safe check for the file size. It should be < 10KB.
      if (file.size > 10 * 1024) {
        notification.error({
          message: lang.t('input.error.keystore.invalid'),
          duration: 5,
        });
        return false;
      }
      reader.onload = () => {
        try {
          const result = `${reader.result}`;
          if (JSON.parse(result)) {
            keystores[file.name] = result;
            // Update keystores list
            xconf.setConf(XConfKeys.KEYSTORES, keystores);
            // Update component state
            store.keystores = keystores;

            // Select current file store.
            store.selectKeystore(file.name);
          } else {
            throw new Error(lang.t('input.error.keystore.invalid'));
          }
        } catch (e) {
          notification.error({
            message: lang.t('input.error.keystore.invalid'),
            duration: 5,
          });
        }
      };
      reader.readAsText(file);
      return false;
    },
  }));

  const renderKeystoreMenu = () => {
    const { keystores } = store;
    const keystoresList = Object.keys(keystores);
    const uploadProps = {
      beforeUpload: store.readFileStore,
      showUploadList: false,
      accept: '.json,application/json,text/json',
    };

    if (!keystoresList.length || !isElectron()) {
      return (
        <Upload {...uploadProps}>
          <Button>
            <Icon type="key" />
            {lang.t('unlock_by_keystore_file.browse_file')}
          </Button>
        </Upload>
      );
    }

    const menu = (
      <Menu>
        {keystoresList.map((name, i) => (
          <Menu.Item key={i} onClick={() => store.selectKeystore(name)} style={{ textAlign: 'right' }}>
            <Tag onClose={() => store.deleteKeystore(name)} closable={true} className="keystore-tag">
              {name}
            </Tag>
          </Menu.Item>
        ))}
        <Menu.Item>
          <Upload {...uploadProps}>
            <Icon type="key" />
            {lang.t('unlock_by_keystore_file.browse_file')}
          </Upload>
        </Menu.Item>
      </Menu>
    );

    return (
      <Dropdown overlay={menu}>
        <Button>
          {lang.t('unlock_by_keystore_file.select_file')}
          <Icon type="down" />
        </Button>
      </Dropdown>
    );
  };

  return useObserver(() => (
    <Form.Item
      label={<FormLabelComponent>{lang.t('wallet.input.keystore')}</FormLabelComponent>}
      rules={[{ required: true, message: lang.t('input.error.keystore.require') }]}
      fieldKey="keystore"
      key="keystore"
    >
      {renderKeystoreMenu()}
      <div>
        {store.keyname ? (
          <Tag
            onClose={store.clearSelected}
            closable={true}
            className="keystore-tag"
            style={{
              marginTop: 5,
            }}
          >
            <Icon type="file" />
            {store.keyname}
          </Tag>
        ) : null}
      </div>
    </Form.Item>
  ));
};
