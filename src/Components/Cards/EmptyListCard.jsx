import { StyleSheet, Text, View } from 'react-native';
import React, { memo } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const EmptyListCard = ({ title = 'No Data Found' }) => {
  return (
    <View style={styles.container}>
      <MaterialIcons name="inbox" size={60} color="#A0A0A0" style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

export default memo(EmptyListCard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    color: '#888',
  },
});
