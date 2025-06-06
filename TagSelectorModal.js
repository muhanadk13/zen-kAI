import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
import { defaultTags, getUserTags, addUserTag, removeUserTag } from './utils/tags';
import { updateDailyGoal } from './utils/scoring';

export default function TagSelectorModal({ visible, onClose, selectedTags, toggleTag }) {
  const [userTags, setUserTags] = useState([]);
  const [search, setSearch] = useState('');
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (visible) getUserTags().then(setUserTags);
  }, [visible]);

  const handleAddCustom = async () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await addUserTag(trimmed);
    setUserTags(updated);
    toggleTag(trimmed);
    updateDailyGoal('addTag');
    setCustom('');
  };

  const renderTag = (tag, isUserTag = false) => {
    if (search && !tag.toLowerCase().includes(search.toLowerCase())) return null;
    const selected = selectedTags.includes(tag);

    const handlePress = () => {
      toggleTag(tag);
      Haptics.selectionAsync();
      updateDailyGoal('addTag');
    };

    const handleLongPress = async () => {
      if (!isUserTag) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const updated = await removeUserTag(tag);
      setUserTags(updated);
      if (selected) toggleTag(tag);
    };

    return (
      <Animatable.View key={tag} animation="fadeIn" duration={200} style={styles.tagWrapper}>
        <TouchableOpacity
          style={[styles.tag, selected && styles.tagSelected]}
          onPress={handlePress}
          onLongPress={handleLongPress}
        >
          <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modal}>
            <TextInput
              style={styles.search}
              placeholder="Search or filter tags..."
              placeholderTextColor="#aaa"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.section}>Emotions</Text>
              <View style={styles.tagRow}>{defaultTags.emotions.map((t) => renderTag(t))}</View>

              <Text style={styles.section}>Activities</Text>
              <View style={styles.tagRow}>{defaultTags.activities.map((t) => renderTag(t))}</View>

              <Text style={styles.section}>Themes</Text>
              <View style={styles.tagRow}>{defaultTags.themes.map((t) => renderTag(t))}</View>

              <Text style={styles.section}>Custom Tags</Text>
              <View style={styles.tagRow}>{userTags.map((t) => renderTag(t, true))}</View>

              <View style={styles.customRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Create your own"
                  placeholderTextColor="#aaa"
                  value={custom}
                  onChangeText={setCustom}
                />
                <TouchableOpacity
                  style={[styles.addButton, !custom.trim() && styles.addButtonDisabled]}
                  onPress={handleAddCustom}
                  disabled={!custom.trim()}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.done} onPress={onClose}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  search: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    marginTop: 70,
  
  },
  scroll: {
    paddingBottom: 16,
  },
  section: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginTop: 18,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagWrapper: {
    margin: 4,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tagSelected: {
    backgroundColor: '#007AFF',
  },
  tagText: {
    fontSize: 14,
    color: '#111',
  },
  tagTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonDisabled: {
    backgroundColor: '#C7D2FE',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginBottom: 40,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
