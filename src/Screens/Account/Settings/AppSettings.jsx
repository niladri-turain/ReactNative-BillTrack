import {ScrollView, StyleSheet, ToastAndroid} from 'react-native';
import React from 'react';
import {Layout} from '../../Layout';
import {
  DottedDivider,
  SecondaryHeader,
  SettingSwitchCard,
} from '../../../Components';
import {useAppSettings} from '../../../Contexts/AppSettingContexts';
import {useSubscription} from '../../../Contexts/AuthContext';

const AppSettings = () => {
  const {appSettings, updateAppSettings} = useAppSettings();
  const isPremiumPlanAndActive = useSubscription('isPremiumPlanAndActive');

  return (
    <Layout>
      <SecondaryHeader
        title="App Settings"
        isSearch={false}
        isQuestion={false}
        isNotification={false}
      />
      <ScrollView style={{flex: 1, backgroundColor: '#fff'}}>
        <SettingSwitchCard
          titile="Print on Create Bill(Premium)"
          subtitle="Automatically print bill when 'Print' button is pressed in create bill"
          isSwitch={appSettings.PRINT_ON_CREATE_BILL}
          onValueChange={async value => {
            if (!isPremiumPlanAndActive) {
              ToastAndroid.show('Premium Plan Required', ToastAndroid.SHORT);
              return;
            }
            await updateAppSettings('PRINT_ON_CREATE_BILL', value);
          }}
          // disabled={!isPremiumPlanAndActive}
        />
        <DottedDivider marginVertical={0} />{' '}
        <SettingSwitchCard
          titile="Send Whatsapp Bill on Create Bill"
          subtitle="Automatically print bill when 'Print' button is pressed in create bill"
          isSwitch={appSettings.SEND_WHATSAPP_BILL_ON_CREATE_BILL}
          onValueChange={async value => {
            await updateAppSettings('SEND_WHATSAPP_BILL_ON_CREATE_BILL', value);
          }}
        />
        <DottedDivider marginVertical={0} />
        <SettingSwitchCard
          titile="Send Whatsapp"
          subtitle="Send Bill to Whatsapp"
          isSwitch={appSettings.SEND_TO_WHATSAPP}
          onValueChange={async value => {
            await updateAppSettings('SEND_TO_WHATSAPP', value);
          }}
        />
        <DottedDivider marginVertical={0} />
        <SettingSwitchCard
          titile="Send SMS(Premium)"
          subtitle="Send Bill to SMS"
          isSwitch={appSettings.SEND_TO_SMS}
          onValueChange={async value => {
            if (!isPremiumPlanAndActive) {
              ToastAndroid.show('Premium Plan Required', ToastAndroid.SHORT);
              return;
            }
            await updateAppSettings('SEND_TO_SMS', value);
          }}
          // disabled={!isPremiumPlanAndActive}
        />
        <DottedDivider marginVertical={0} />
      </ScrollView>
    </Layout>
  );
};

export default AppSettings;
