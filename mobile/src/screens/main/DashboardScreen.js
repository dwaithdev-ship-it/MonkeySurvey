import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Card, Paragraph, Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

const DashboardScreen = () => {
    const { user } = useSelector((state) => state.auth);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Title>Welcome, {user?.firstName || 'User'}!</Title>
                <Text>Here is your survey overview</Text>
            </View>

            <View style={styles.statsContainer}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>12</Title>
                        <Paragraph>Active Surveys</Paragraph>
                    </Card.Content>
                </Card>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>450</Title>
                        <Paragraph>Total Responses</Paragraph>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 10,
        justifyContent: 'space-between',
    },
    card: {
        flex: 1,
        margin: 5,
        elevation: 4,
    },
});

export default DashboardScreen;
