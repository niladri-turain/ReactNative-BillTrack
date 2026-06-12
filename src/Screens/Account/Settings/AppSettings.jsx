import { ScrollView, StyleSheet, ToastAndroid, View, Text, Switch, Image } from 'react-native';
import React from 'react';
import { Layout } from '../../Layout';
import { SecondaryHeader } from '../../../Components';
import { useAppSettings } from '../../../Contexts/AppSettingContexts';
import { useSubscription } from '../../../Contexts/AuthContext';



const AppSettings = () => {
  const { appSettings, updateAppSettings } = useAppSettings();
  const isPremiumPlanAndActive = useSubscription('isPremiumPlanAndActive');

  const handleToggle = async (key, value) => {
    const isPremiumFeature = key === 'PRINT_ON_CREATE_BILL' || key === 'SEND_TO_SMS';
    
    if (isPremiumFeature && !isPremiumPlanAndActive) {
      ToastAndroid.show('Premium Plan Required', ToastAndroid.SHORT);
      return;
    }
    await updateAppSettings(key, value);
  };

  return (
    <Layout>
      <SecondaryHeader
        title="App Settings"
        isSearch={false}
        isQuestion={false}
        isNotification={false}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* ১. Print on Create Bill Card */}
        <SettingCard
          title="Print on Create Bill"
          subtitle="Automatically print bill when 'Print' button is pressed in create bill"
          isPremium={true}
          value={appSettings.PRINT_ON_CREATE_BILL}
          onValueChange={(val) => handleToggle('PRINT_ON_CREATE_BILL', val)}
          iconText="🖨️" 
          iconBgColor="#FFF0E6"
        />

        {/* ২. Send WhatsApp Card */}
        <SettingCard
          title="Send WhatsApp"
          subtitle="Send Bill to WhatsApp"
          isPremium={false}
          value={appSettings.SEND_TO_WHATSAPP}
          onValueChange={(val) => handleToggle('SEND_TO_WHATSAPP', val)}
          iconText="💬" 
          iconBgColor="#E8F8EF"
        />

        {/* ৩. Send SMS Card */}
        <SettingCard
          title="Send SMS"
          subtitle="Send Bill to SMS"
          isPremium={true}
          value={appSettings.SEND_TO_SMS}
          onValueChange={(val) => handleToggle('SEND_TO_SMS', val)}
          iconText="✉️" 
          iconBgColor="#EBF3FF"
        />

      </ScrollView>
    </Layout>
  );
};


const SettingCard = ({ title, subtitle, isPremium, value, onValueChange, iconText, iconBgColor }) => {
  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        {/* Left Icon Container */}
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Text style={{ fontSize: 24 }}>{iconText}</Text>
        </View>

        {/* Middle Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {title} {isPremium && <Text style={styles.premiumText}>(Premium)</Text>}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Right Switch */}
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D1D1D6', true: '#FF7A30' }}
          thumbColor={'#fff'}
          ios_backgroundColor="#D1D1D6"
        />
      </View>

      {/* Premium Badge & Arrow Footer */}
      <View style={styles.cardFooter}>
        {isPremium ? (
          <View style={styles.premiumBadge}>
            <Text style={styles.badgeText}>👑 Premium</Text>
          </View>
        ) : (
          <View /> 
        )}
        {/* Arrow Icon */}
        <Text style={styles.arrowText}>❯</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  premiumText: {
    color: '#FF7A30',
    fontSize: 13,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#F2F2F7',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FF7A30',
    fontSize: 12,
    fontWeight: '600',
  },
  arrowText: {
    fontSize: 16,
    color: '#C7C7CC',
    fontWeight: 'bold',
  },
});

export default AppSettings;