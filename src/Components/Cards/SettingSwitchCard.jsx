import {StyleSheet, Switch, Text, View} from 'react-native';
import {font, icon, padding} from '../../utils/responsive';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';

const SettingSwitchCard = ({
  titile = '',
  subtitle = '',
  paddingHorizontal = 16,
  paddingVertical = 10,
  isSwitch = false,
  onValueChange = () => {},
  disabled = false,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: padding(paddingHorizontal),
          paddingVertical: padding(paddingVertical),
        },
      ]}>
      <View style={styles.leftContainer}>
        <Text style={styles.title}>{titile}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.rightContainer, isSwitch && styles.switchActive]}>
        <Switch
          trackColor={{false: 'transparent', true: 'transparent'}}
          thumbColor={'#fff'}
          value={isSwitch}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

export default SettingSwitchCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightContainer: {
    backgroundColor: colors.border,
    borderRadius: icon(15),
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  leftContainer: {
    flex: 1,
  },
  title: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    color: '#00000090',
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: '#00000080',
  },
});
