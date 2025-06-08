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
import { LinearGradient } from 'expo-linear-gradient';
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

    const TagContent = (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={[styles.tagInner, selected && styles.tagSelectedInner]}
      >
        <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
      </TouchableOpacity>
    );

    return (
      <Animatable.View key={tag} animation="fadeIn" duration={200} style={styles.tagWrapper}>
        {selected ? (
          <LinearGradient
            colors={['#646DFF', '#D7A4FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            {TagContent}
          </LinearGradient>
        ) : (
          TagContent
        )}
      </Animatable.View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <LinearGradient colors={["#0f0f11", "#1c1e29"]} style={styles.modal}>
            <TextInput
              style={styles.search}
              placeholder="Search or filter tags..."
              placeholderTextColor="#aaa"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
          </LinearGradient>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modal: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    backgroundColor: 'transparent',
  },
  search: {
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#1F2430',
    color: '#FFFFFF',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  scroll: {
    paddingBottom: 120,
  },
  section: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 10,
    letterSpacing: 0.7,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  tagWrapper: {
    marginBottom: 8,
  },
  gradientBorder: {
    borderRadius: 24,
    padding: 2,
    shadowColor: '#D7A4FF',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tagInner: {
    backgroundColor: '#2A2F3E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  tagSelectedInner: {
    backgroundColor: '#131620',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#1F2430',
    color: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  addButton: {
    backgroundColor: '#646DFF',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#646DFF',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  addButtonDisabled: {
    backgroundColor: '#475569',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  done: {
    backgroundColor: '#646DFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 22,
    shadowColor: '#646DFF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
});


