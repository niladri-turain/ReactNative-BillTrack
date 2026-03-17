import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Octicons from '@react-native-vector-icons/octicons';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import {
  font,
  gap,
  heightResponsive,
  icon,
  padding,
  widthResponsive,
} from '../../utils/responsive';
import {useAuth, useBusiness, useUser} from '../../Contexts/AuthContext';
import {greeting} from '../../utils/validator';
import {API_URL} from '../../utils/config';
import {useNavigation} from '@react-navigation/native';

const PrimaryHeader = memo(() => {
  const name = useUser('name');
  const businessUrl = useBusiness('logoUrl');
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.leftContainer}
        onPress={() => navigation.navigate('Business')}>
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.gradientBorder}>
          <Image
            source={{uri: `${API_URL}files/logo/${businessUrl}`}}
            style={styles.image}
            resizeMode="cover"
          />
        </LinearGradient>
        <View>
          <Text style={styles.text}>{greeting()}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
      </Pressable>
      {/* <TouchableOpacity style={styles.rightContainer}>
        <Octicons name="bell" size={24} />
        <View style={styles.dot} />
      </TouchableOpacity> */}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: icon(60),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: padding(16),
    backgroundColor: '#fff',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(10),
  },
  gradientBorder: {
    width: icon(48),
    height: icon(48),
    borderRadius: icon(48),
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: icon(43),
    height: icon(43),
    borderRadius: icon(43),
    backgroundColor: '#fff',
  },
  text: {
    fontSize: font(11),
    fontFamily: fonts.onMedium,
  },
  name: {
    fontSize: font(16),
    fontFamily: fonts.onSemiBold,
    color: colors.primary,
  },
  dot: {
    position: 'absolute',
    width: widthResponsive(10),
    height: heightResponsive(10),
    borderRadius: 10 / 2,
    backgroundColor: colors.primary,
    right: 0,
    top: 0,
  },
  rightContainer: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrimaryHeader;
