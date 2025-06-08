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
    backgroundColor: '#262B3A',
    color: '#FFFFFF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  scroll: {
    paddingBottom: 80,
  },
  section: {
    fontSize: 15,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 28,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagWrapper: {
    marginBottom: 8,
    marginRight: 8,
  },
  gradientBorder: {
    borderRadius: 20,
    padding: 2,
    shadowColor: '#646DFF',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tagInner: {
    backgroundColor: '#2E3340',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagSelectedInner: {
    backgroundColor: '#11131A',
  },
  tagText: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  tagTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#262B3A',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#646DFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#646DFF',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  addButtonDisabled: {
    backgroundColor: '#475569',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  done: {
    backgroundColor: '#646DFF',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

