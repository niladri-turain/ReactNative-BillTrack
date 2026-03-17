import {ScrollView, StyleSheet, Text, ToastAndroid, View} from 'react-native';
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
import {useSubscription} from '../../../Contexts/AuthContext';

const Settings = () => {
  const navigation = useNavigation();
  const handleNavigation = ({screen, data = {}}) => {
    navigation.navigate(screen, {data});
  };

  const isPremiumPlanAndActive = useSubscription('isPremiumPlanAndActive');

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
            title={'Printer Setup'}
            textFontSize={16}
            tag
            tagText={'Premium'}
            onpress={() => {
              if (!isPremiumPlanAndActive) {
                ToastAndroid.show(
                  'Please upgrade to premium plan to use this feature',
                  ToastAndroid.LONG,
                );
                return;
              }
              handleNavigation({screen: 'PrinterSetup'});
            }}
          />
        </View>
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
