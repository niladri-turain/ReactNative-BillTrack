import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import React from 'react';
import {Layout} from '../../Layout';
import {
  DottedDivider,
  SecondaryHeader,
  SettingItemsCard,
} from '../../../Components';
import {icon, margin, padding} from '../../../utils/responsive';
import Lucide from '@react-native-vector-icons/lucide';
import {useNavigation} from '@react-navigation/native';
import {useAppSettings} from '../../../Contexts/AppSettingContexts';
import {colors} from '../../../utils/colors';

const Settings = () => {
  const navigation = useNavigation();
  const handleNavigation = ({screen, data = {}}) => {
    navigation.navigate(screen, {data});
  };

  const {appSettings, updateAppSettings, printLocked} = useAppSettings();

  return (
    <Layout>
      <SecondaryHeader
        title="Settings"
        isSearch={false}
        isQuestion={false}
        isNotification={false}
      />
      <ScrollView style={{flex: 1, backgroundColor: '#fff'}}>
        <View style={styles.cardItems}>
          <SettingItemsCard
            mainIcon={<Lucide name="settings" size={icon(24)} color={'#000'} />}
            title={'App Settings'}
            textFontSize={16}
            tag
            tagText={'New'}
            onpress={() => handleNavigation({screen: 'AppSettings'})}
          />
        </View>
        <DottedDivider marginVertical={0} />
        <View style={styles.cardItems}>
          <SettingItemsCard
            mainIcon={<Lucide name="printer" size={icon(24)} color={'#000'} />}
            title={'Print Setup'}
            textFontSize={16}
            rightComponent={
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Switch
                  value={appSettings.PRINT_ON_CREATE_BILL}
                  disabled={printLocked}
                  onValueChange={
                    printLocked
                      ? undefined
                      : val => updateAppSettings('PRINT_ON_CREATE_BILL', val)
                  }
                  trackColor={{false: '#D1D1D6', true: colors.primary}}
                  thumbColor={'#fff'}
                  ios_backgroundColor="#D1D1D6"
                />
                <Lucide name="chevron-right" size={icon(20)} color={'#00000050'} />
              </View>
            }
          //  onpress={() => handleNavigation({screen: 'PrinterSetup'})}
          />
        </View>
        <DottedDivider marginVertical={0} />
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  cardItems: {
    paddingHorizontal: padding(16),
    // marginVertical: margin(5),
  },
});

export default Settings;
