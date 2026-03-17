import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import { AuthLayout } from '../Layout';
import { fonts } from '../../utils/fonts';
import { colors } from '../../utils/colors';
import { useNavigation } from '@react-navigation/native';

const AuthHome = () => {
  const navigation = useNavigation();
  return (
    <AuthLayout>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('./../../../asset/images/authHome.png')}
          style={styles.Image}
          resizeMode="contain"
        />
        <View style={styles.middleTextContainer}>
          <Text style={styles.helloText}>Hello</Text>
          <Text style={styles.descText} numberOfLines={2}>
            Welcome to Billtrack, where you can manage your business invoice
          </Text>
        </View>
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              navigation.navigate('Login');
            }}
          >
            <Text style={styles.btnText}>LOGIN</Text>
          </TouchableOpacity>
          <Text style={styles.orText}>— or —</Text>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: '#000',
              },
            ]}
          >
            <Text style={[styles.btnText, { color: '#000' }]}>REGISTER</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  middleTextContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginVertical: 20,
  },
  helloText: {
    fontSize: 36,
    fontFamily: fonts.onSemiBold,
    color: colors.primary,
  },
  descText: {
    fontSize: 16,
    fontFamily: fonts.onRegular,
    color: '#000',
    textAlign: 'center',
    width: 300,
  },
  bottomContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    marginVertical: 10,
  },
  button: {
    width: 150,
    height: 45,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  btnText: {
    fontSize: 16,
    fontFamily: fonts.onSemiBold,
    color: '#fff',
  },
  orText: {
    fontSize: 16,
    fontFamily: fonts.onSemiBold,
    color: '#00000060',
  },
  Image: {
    width: 250,
    height: 250,
  },
});

export default AuthHome;
