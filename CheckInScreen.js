import React, { useState, useRef, useEffect } from 'react';
     import {
       View,
       Text,
       StyleSheet,
       TextInput,
       TouchableOpacity,
       Image,
       SafeAreaView,
       ScrollView,
       KeyboardAvoidingView,
       LayoutAnimation,
       Platform,
       Animated,
       Keyboard,
       Alert,
     } from 'react-native';
     import Slider from '@react-native-community/slider';
     import { useNavigation, useRoute } from '@react-navigation/native';
     import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
     import AsyncStorage from '@react-native-async-storage/async-storage';
import TagSelectorModal from './TagSelectorModal';

     export default function CheckInScreen() {
       const navigation = useNavigation();
       const route = useRoute();
       const [energy, setEnergy] = useState(50);
       const [clarity, setClarity] = useState(50);
       const [emotion, setEmotion] = useState(50);
      const [note, setNote] = useState('');
      const [selectedTags, setSelectedTags] = useState([]);
      const [tagModalVisible, setTagModalVisible] = useState(false);
       const scrollRef = useRef();
      const lastEnergy = useRef(50);
      const lastClarity = useRef(50);
      const lastEmotion = useRef(50);
      const saveButtonRef = useRef(null);
      const scaleAnim = useRef(new Animated.Value(1)).current;
      const noteLayoutY = useRef(0);

       useEffect(() => {
         const show = Keyboard.addListener('keyboardWillShow', () => {
           if (Platform.OS === 'ios') {
             LayoutAnimation.configureNext(
               LayoutAnimation.Presets.easeInEaseOut
             );
           }
         });
         const hide = Keyboard.addListener('keyboardWillHide', () => {
           if (Platform.OS === 'ios') {
             LayoutAnimation.configureNext(
               LayoutAnimation.Presets.easeInEaseOut
             );
           }
         });
         return () => {
           show.remove();
           hide.remove();
         };
       }, []);

       const getCheckInWindow = () => {
         const hour = new Date().getHours();
         if (hour >= 6 && hour < 12) return 'checkIn1';
         if (hour >= 12 && hour < 17) return 'checkIn2';
         return 'checkIn3';
       };
       const milestones = [0, 25, 50, 75, 100];

const handleSliderChange = (value, setValue, lastRef) => {
  const rounded = Math.round(value);

  // Check if the value is near a milestone
  const isNearMilestone = milestones.some((m) => Math.abs(rounded - m) <= 1);

  // If near a milestone, make the slider "stick" slightly
  if (isNearMilestone) {
    const nearestMilestone = milestones.reduce((prev, curr) =>
      Math.abs(curr - rounded) < Math.abs(prev - rounded) ? curr : prev
    );

    // Adjust the value to stay closer to the milestone
    const adjustedValue = Math.abs(rounded - nearestMilestone) <= 2 ? nearestMilestone : rounded;
    setValue(adjustedValue);

    // Trigger medium haptic feedback only when sliding on a milestone
    if (lastRef.current !== nearestMilestone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      lastRef.current = nearestMilestone;
    }
  } else {
    setValue(value);
    lastRef.current = rounded; // Update lastRef to avoid repeated haptics
  }
};

const toggleTag = (tag) => {
  setSelectedTags((prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
  );
};
       

const handleSave = async () => {
         const timestamp = new Date().toISOString();
         const today = timestamp.split('T')[0];
         const window = route.params?.window || getCheckInWindow();

         const entry = {
           energy,
           clarity,
           emotion,
           note,
           window,
           timestamp,
           tags: selectedTags,
         };

         try {
           const key = `${today}-${window}`;
           const existing = await AsyncStorage.getItem(key);
           if (existing) {
             Alert.alert('Already Checked In', `You've completed ${window}.`);
             return;
           }

           await AsyncStorage.setItem(key, JSON.stringify(entry));
           const historyRaw = await AsyncStorage.getItem('checkInHistory');
           const history = historyRaw ? JSON.parse(historyRaw) : [];
           history.push(entry);
          await AsyncStorage.setItem('checkInHistory', JSON.stringify(history));

          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );

           // Navigate directly to MentalScoreScreen or ReflectionScreen
           navigation.navigate(window === 'checkIn3' ? 'Reflection' : 'MentalScore');
        } catch (err) {
          console.error('❌ Error saving check-in:', err);
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          Alert.alert('Error', 'Failed to save check-in.');
        }
       };


       return (
         <SafeAreaView style={styles.safe}>
           <KeyboardAvoidingView
             style={{ flex: 1 }}
             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
           >
             <ScrollView ref={scrollRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
               <Animatable.View
                 animation="fadeInUp"
                 duration={600}
                 easing="ease-out"
                 delay={100}
               >
                 <Text style={styles.title}>Daily Check-In</Text>
                 <Text style={styles.subtitle}>Reflect on your current state.</Text>

                 <Text style={styles.label}>Energy</Text>
                 <Slider
                   style={styles.slider}
                   minimumValue={0}
                   maximumValue={100}
                   value={energy}
                   onValueChange={(val) => handleSliderChange(val, setEnergy, lastEnergy)}
                   minimumTrackTintColor="#34d399"
                   maximumTrackTintColor="#e5e7eb"
                   thumbTintColor="#10b981"
                 />
                 <View style={styles.range}>
                   <Text style={styles.rangeText}>Depleted</Text>
                   <Text style={styles.rangeText}>Energized</Text>
                 </View>

                 <Text style={styles.label}>Clarity</Text>
                 <Slider
                   style={styles.slider}
                   minimumValue={0}
                   maximumValue={100}
                   value={clarity}
                   onValueChange={(val) => handleSliderChange(val, setClarity, lastClarity)}
                   minimumTrackTintColor="#60a5fa"
                   maximumTrackTintColor="#e5e7eb"
                   thumbTintColor="#3b82f6"
                 />
                 <View style={styles.range}>
                   <Text style={styles.rangeText}>Foggy</Text>
                   <Text style={styles.rangeText}>Focused</Text>
                 </View>

                 <Text style={styles.label}>Emotion</Text>
                 <Slider
                   style={styles.slider}
                   minimumValue={0}
                   maximumValue={100}
                   value={emotion}
                   onValueChange={(val) => handleSliderChange(val, setEmotion, lastEmotion)}
                   minimumTrackTintColor="#fcd34d"
                   maximumTrackTintColor="#e5e7eb"
                   thumbTintColor="#fbbf24"
                 />
                 <View style={styles.range}>
                   <Text style={styles.rangeText}>Down</Text>
                   <Text style={styles.rangeText}>Upbeat</Text>
                 </View>

                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your thoughts..."
                  placeholderTextColor="#999"
                  value={note}
                  onChangeText={(text) => setNote(text.slice(0, 250))}
                  onLayout={(e) => {
                    noteLayoutY.current = e.nativeEvent.layout.y;
                  }}
                  onFocus={() =>
                    setTimeout(() => {
                      scrollRef.current?.scrollTo({
                        y: noteLayoutY.current - 20,
                        animated: true,
                      });
                    }, 100)
                  }
                  multiline
                  maxLength={250}
                />

                <TouchableOpacity
                  style={styles.tagButton}
                  onPress={() => setTagModalVisible(true)}
                >
                  <Text style={styles.tagButtonText}>+ Add Tags</Text>
                </TouchableOpacity>
                <View style={styles.tagList}>
                  {selectedTags.map((t) => (
                    <View key={t} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{t}</Text>
                      <TouchableOpacity onPress={() => toggleTag(t)}>
                        <Text style={styles.removeTag}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                 <Animatable.View
                   ref={saveButtonRef}
                   animation="fadeInUp"
                   duration={600}
                   easing="ease-out"
                   delay={400}
                 >
                   <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                     <TouchableOpacity
                       style={styles.button}
                       onPress={async () => {
                         Animated.sequence([
                           Animated.timing(scaleAnim, {
                             toValue: 1.08,
                             duration: 100,
                             useNativeDriver: true,
                           }),
                           Animated.timing(scaleAnim, {
                             toValue: 1,
                             duration: 100,
                             useNativeDriver: true,
                           }),
                         ]).start();
                         await Haptics.selectionAsync();
                         await handleSave();
                       }}
                       activeOpacity={0.7}
                     >
                       <Text style={styles.buttonText}>Save Check-In</Text>
                     </TouchableOpacity>
                   </Animated.View>
                 </Animatable.View>


                 <View style={styles.footer}>
                   <Image source={require('./assets/lock.png')} style={styles.lockIcon} />
                   <Text style={styles.footerText}>Private — stored on your device</Text>
                 </View>
               </Animatable.View>
             </ScrollView>
           </KeyboardAvoidingView>
         </SafeAreaView>
        <TagSelectorModal
          visible={tagModalVisible}
          onClose={() => setTagModalVisible(false)}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
        />
      );
    }

     const styles = StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: '#F2F2F7',
      },
      container: {
        padding: 24,
        paddingBottom: 120,
        backgroundColor: '#F2F2F7',
      },
       title: {
         fontSize: 28,
         fontWeight: '700',
         color: '#111827',
         marginBottom: 4,
       },
       subtitle: {
         fontSize: 15,
         color: '#6b7280',
         marginBottom: 24,
       },
       label: {
         fontSize: 17,
         fontWeight: '600',
         color: '#111827',
         marginBottom: 6,
       },
       slider: {
         width: '100%',
         height: 40,
         marginBottom: 4,
       },
       range: {
         flexDirection: 'row',
         justifyContent: 'space-between',
         marginBottom: 20,
       },
       rangeText: {
         fontSize: 13,
         color: '#6b7280',
       },
      input: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#111827',
        marginBottom: 24,
        minHeight: 80,
      },
      tagButton: {
        backgroundColor: '#e5e7eb',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
      },
      tagButtonText: {
        color: '#111827',
        fontWeight: '600',
      },
      tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
      },
      tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e5e5ea',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        margin: 4,
      },
      tagChipText: {
        color: '#111827',
        marginRight: 4,
      },
      removeTag: {
        color: '#6b7280',
        fontSize: 16,
        paddingLeft: 4,
        paddingRight: 2,
      },
      button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
         shadowColor: '#000',
         shadowOpacity: 0.05,
         shadowOffset: { width: 0, height: 4 },
         shadowRadius: 10,
       },
       buttonText: {
         color: '#fff',
         fontSize: 16,
         fontWeight: '600',
       },
       footer: {
         flexDirection: 'row',
         justifyContent: 'center',
         alignItems: 'center',
         marginTop: 24,
       },
       footerText: {
         fontSize: 12,
         color: '#9ca3af',
         marginLeft: 6,
       },
       lockIcon: {
         width: 14,
         height: 14,
         tintColor: '#9ca3af',
       },
     });
