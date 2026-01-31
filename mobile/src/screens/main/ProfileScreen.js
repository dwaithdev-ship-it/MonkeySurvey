import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Avatar, Title, List, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const ProfileScreen = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Avatar.Icon size={80} icon="account" />
                <Title>{user?.firstName} {user?.lastName}</Title>
            </View>
            <Divider />
            <List.Section>
                <List.Item title="Settings" left={(props) => <List.Icon {...props} icon="cog" />} />
                <List.Item title="Notifications" left={(props) => <List.Icon {...props} icon="bell" />} />
                <List.Item title="Help & Support" left={(props) => <List.Icon {...props} icon="help-circle" />} />
            </List.Section>
            <Button mode="outlined" onPress={() => dispatch(logout())} style={styles.logoutButton}>Logout</Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { alignItems: 'center', padding: 30 },
    logoutButton: { margin: 20 },
});

export default ProfileScreen;
