import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Voice from '@react-native-voice/voice'
const ChatBotScreen: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [recipes, setRecipes] = useState<any[]>([]);
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        Voice.onSpeechResults = onSpeechResultsHandler;
        Voice.onSpeechError = onSpeechErrorHandler;

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const onSpeechResultsHandler = (event: any) => {
        if (event.value && event.value.length > 0) {
            setInputText(event.value[0]);
            setIsListening(false);
        }
    };

    const onSpeechErrorHandler = (error: any) => {
        console.error('Voice Recognition Error:', error);
        setIsListening(false);
    };

    const startListening = async () => {
        try {
            //setInputText('');
            setIsListening(true);
            await Voice.stop();
            await Voice.start('en-US');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            setIsListening(false);
        }
    };

    const stopListening = async () => {
        try {
            setIsListening(false);
            await Voice.stop();
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }
    };

    const fetchRecipeInstructions = async (recipeId: number) => {
        try {
            const response = await axios.get(
                `https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions`,
                {
                    params: {
                        apiKey: '3d4bd574f6de43c7a113458ea476599a',
                    },
                }
            );

            // Extract and format instructions
            if (response.data.length > 0) {
                return response.data[0].steps.map((step: any) => ({
                    number: step.number,
                    instruction: step.step,
                }));
            } else {
                return 'No instructions available.';
            }
        } catch (error) {
            console.error('Error fetching recipe instructions:', error);
            return 'Error fetching instructions.';
        }
    };

    const fetchRecipes = async () => {
        await stopListening();
        try {
            const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
                params: {
                    query: inputText,
                    number: 5,
                    apiKey: '3d4bd574f6de43c7a113458ea476599a',
                },
            });
            const recipeData = await Promise.all(
                response.data.results.map(async (recipe: any) => ({
                    id: recipe.id,
                    title: recipe.title,
                    instructions: await fetchRecipeInstructions(recipe.id),
                }))
            );


            setRecipes(recipeData);
            await AsyncStorage.setItem('savedRecipes', JSON.stringify(recipeData));
        } catch (error) {
            console.error('Error fetching recipes:', error);
        }
        if (!inputText) {
            Alert.alert('Error', 'Please provide input for the search.');
            return;
        }
    };

    const loadSavedRecipes = async () => {
        try {
            const savedRecipes = await AsyncStorage.getItem('savedRecipes');
            if (savedRecipes) {
                setRecipes(JSON.parse(savedRecipes));
            }
        } catch (error) {
            console.error('Error loading saved recipes:', error);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Text style={styles.title}>Food Recipe ChatBot</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Type your query"
                    value={inputText}
                    onChangeText={setInputText}
                />
                <View style={styles.buttonContainer}>
                    <Button title="Search Recipes" onPress={fetchRecipes} />
                    <Button
                        title={isListening ? "Stop Listening" : "Use Voice"}
                        onPress={isListening ? stopListening : startListening}
                    />
                    <Button title="Load Saved Recipes" onPress={loadSavedRecipes} />
                </View>
                <FlatList
                    data={recipes}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.recipeItem}>
                            <Text style={styles.recipeTitle}>{item.title}</Text>
                            {item.instructions.length > 0 ? (
                                item.instructions.map((step: any, index: number) => (
                                    <Text key={index} style={styles.recipeStep}>
                                        <Text style={styles.stepNumber}>{step.number}.</Text> {step.instruction}
                                    </Text>
                                ))
                            ) : (
                                <Text style={styles.noInstructions}>No instructions available.</Text>
                            )}</TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 150 }} // Add padding at the bottom

                />
            </View></SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 8,
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    recipeItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    recipeStep: {
        fontSize: 14,
        color: '#555',
        marginTop: 8,
    },
    stepNumber: {
        fontWeight: 'bold',
        color: '#000',
    },
    noInstructions: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
});

export default ChatBotScreen;
