import {Linking, ScrollView, StyleSheet, Text, View} from 'react-native';
import React, {memo} from 'react';
import {Layout} from '../Layout';
import {
  NavigationCard,
  SecondaryHeader,
  SettingItemsCard,
} from '../../Components';
import Ionicons from '@react-native-vector-icons/ionicons';
import {colors} from '../../utils/colors';
import {font, icon, margin, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import {helpAndSupportNavigations} from '../../utils/data';
import {useNavigation} from '@react-navigation/native';
import { useBusiness } from '../../Contexts/AuthContext';

const HelpAndSupport = memo(() => {

  const business=useBusiness('name');

  const navigation = useNavigation();
  const handleCallClick=()=>{
    const tellUrl=`tel:+918436751388`
    Linking.openURL(tellUrl)
  }

  const handleWhatsappChat=async()=>{
    const encodedMessage=`Hello, this is ${business}. We would like assistance regarding BillTrack. Kindly guide us on the next steps. Thank you.`
    const whatsappUrl = `whatsapp://send?phone=${+918240105899}&text=${encodeURIComponent(
        encodedMessage,
      )}`;
    
      try {
        const canOpen = await Linking.canOpenURL(whatsappUrl);
    
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web if WhatsApp app not installed
          const webUrl = `https://wa.me/${918240105899}?text=${encodeURIComponent(
            encodedMessage,
          )}`;
          await Linking.openURL(webUrl);
        }
      } catch (error) {
        Alert.alert(
          'WhatsApp Not Found',
          'Please install WhatsApp to share invoice.',
        );
      }
  }

  return (
    <Layout>
      <SecondaryHeader title="Help & support" isSearch={false} />
      <ScrollView
        style={{flex: 1, backgroundColor: '#fff'}}
        contentContainerStyle={styles.container}>
        <View style={styles.topCOntainer}>
          <SettingItemsCard
            title={'Call Support'}
            mainIcon={
              <Ionicons
                name="call-outline"
                color={colors.primary}
                size={icon(20)}
              />
            }
            onpress={handleCallClick}
          />
          <SettingItemsCard
            title={'Chat Support'}
            mainIcon={
              <Ionicons
                name="chatbubble-outline"
                color={colors.primary}
                size={icon(20)}
              />
            }
            onpress={handleWhatsappChat}
          />
        </View>
        <View style={styles.bottomContainer}>
          <Text style={styles.itemTitleText}>FAQs</Text>
          {helpAndSupportNavigations.map((item, index) => (
            <NavigationCard
              title={item.name}
              onpress={() => {
                navigation.navigate('Browser', {
                  uri: item.url,
                });
              }}
            />
          ))}
        </View>
      </ScrollView>
    </Layout>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  topCOntainer: {
    paddingHorizontal: padding(16),
    borderTopWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: colors.border,
    paddingVertical: padding(5),
  },
  bottomContainer: {
    paddingHorizontal: padding(16),
    paddingVertical: padding(5),
    marginVertical: margin(10),
  },
  itemTitleText: {
    fontSize: font(16),
    fontFamily: fonts.inRegular,
    marginBottom: margin(10),
  },
});

export default HelpAndSupport;
