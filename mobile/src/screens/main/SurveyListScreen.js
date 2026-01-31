import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Title, FAB } from 'react-native-paper';

const surveys = [
    { id: '1', title: 'Customer Satisfaction', responses: 45 },
    { id: '2', title: 'Employee Feedback', responses: 12 },
    { id: '3', title: 'Product Review', responses: 89 },
];

const SurveyListScreen = () => {
    return (
        <View style={styles.container}>
            <FlatList
                data={surveys}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.title}
                        description={`${item.responses} responses`}
                        left={(props) => <List.Icon {...props} icon="poll" />}
                        onPress={() => { }}
                    />
                )}
            />
            <FAB icon="plus" style={styles.fab} onPress={() => { }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});

export default SurveyListScreen;
