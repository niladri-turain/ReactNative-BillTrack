import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React, {memo} from 'react';
import {Layout} from '../Layout';
import {NavigationCard, SecondaryHeader} from '../../Components';
import {margin, padding} from '../../utils/responsive';
import {colors} from '../../utils/colors';
import {aboutScreenNavigations} from '../../utils/data';
import {useNavigation} from '@react-navigation/native';

const About = memo(() => {
  const navigation = useNavigation();
  return (
    <Layout>
      <SecondaryHeader title="About billtrack" isSearch={false} />
      <ScrollView
        style={{flex: 1, backgroundColor: '#fff'}}
        contentContainerStyle={styles.container}>
        <View style={styles.contentContainer}>
          {aboutScreenNavigations.map((item, index) => (
            <NavigationCard
              key={index}
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
    paddingTop: padding(10),
    marginBottom: margin(10),
  },
  contentContainer: {
    paddingHorizontal: padding(16),
    borderTopWidth: 0.8,
    borderColor: colors.border,
  },
});

export default About;
