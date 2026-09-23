import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {memo} from 'react';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import AntDesign from '@react-native-vector-icons/ant-design';
import {font, padding} from './../../utils/responsive';
import {useBusiness, useUser} from '../../Contexts/AuthContext';
import {API_URL} from '../../utils/config';

const ProfileCard = memo(
  ({
    logoUrl,
    userName,
    userPhone,
    planName,
    onpressEditBtn = () => {},
    onPressUpgrade = () => {},
  }) => {
    return (
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <Image
            source={{uri: `${API_URL}files/logo/${logoUrl}`}}
            style={styles.image}
          />
          <View style={styles.leftRightContainer}>
            <Text style={styles.nameText}>{userName}</Text>
            <Text style={styles.numberText}>+91 {userPhone}</Text>
            {!!planName && (
              <TouchableOpacity
                style={styles.planBadge}
                onPress={onPressUpgrade}>
                <Text style={styles.planBadgeText}>{planName}</Text>
                <Text style={styles.upgradeText}>Upgrade</Text>
                <AntDesign
                  name="arrowright"
                  size={10}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={onpressEditBtn}>
          <AntDesign name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    padding: padding(16),
    // backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  leftRightContainer: {
    // gap: ,
  },
  nameText: {
    fontSize: font(18),
    fontFamily: fonts.popSemiBold,
  },
  numberText: {
    fontSize: font(14),
    fontFamily: fonts.popRegular,
  },
  planBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: padding(3),
    paddingHorizontal: padding(8),
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
  },
  planBadgeText: {
    fontSize: font(11),
    fontFamily: fonts.inMedium,
    color: '#000',
  },
  upgradeText: {
    fontSize: font(11),
    fontFamily: fonts.inBold,
    color: colors.primary,
  },
  editBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileCard;
