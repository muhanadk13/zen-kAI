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
import ConfettiCannon from 'react-native-confetti-cannon';
import { defaultTags, getUserTags, addUserTag, removeUserTag } from './utils/tags';

export default function TagSelectorModal({
  visible,
  onClose,
  selectedTags,
  toggleTag,
}) {
  const [userTags, setUserTags] = useState([]);
  const [search, setSearch] = useState('');
  const [custom, setCustom] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) {
      getUserTags().then(setUserTags);
    }
  }, [visible]);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleAddCustom = async () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await addUserTag(trimmed);
    setUserTags(updated);
    toggleTag(trimmed);
    setCustom('');
    setShowConfetti(true);
  };

  const highlightTag = (t) => {
    if (!search) return t;
    const lower = t.toLowerCase();
    const idx = lower.indexOf(search.toLowerCase());
    if (idx === -1) return t;
    return (
      <>
        {t.slice(0, idx)}
        <Text style={styles.highlight}>{t.slice(idx, idx + search.length)}</Text>
        {t.slice(idx + search.length)}
      </>
    );
  };

  const renderTag = (tag, user = false) => {
    if (search && !tag.toLowerCase().includes(search.toLowerCase())) return null;
    const selected = selectedTags.includes(tag);
    const handlePress = () => {
      toggleTag(tag);
      Haptics.selectionAsync();
    };
    const handleLongPress = async () => {
      if (!user) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const updated = await removeUserTag(tag);
      setUserTags(updated);
      if (selected) toggleTag(tag);
    };
    return (
      <Animatable.View key={tag} animation="fadeIn" duration={300} style={styles.tagWrapper}>
        <TouchableOpacity
          style={[styles.tag, selected && styles.tagSelected]}
          onPress={handlePress}
          onLongPress={handleLongPress}
        >
          <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
            {highlightTag(tag)}
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modal}>
            <Text style={styles.header}>Add Tags</Text>
            <TextInput
              style={styles.search}
              placeholder="Search tags"
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.section}>Emotions</Text>
          <View style={styles.tagRow}>{defaultTags.emotions.map((t) => renderTag(t))}</View>
          <Text style={styles.section}>Activities</Text>
          <View style={styles.tagRow}>{defaultTags.activities.map((t) => renderTag(t))}</View>
          <Text style={styles.section}>Themes</Text>
          <View style={styles.tagRow}>{defaultTags.themes.map((t) => renderTag(t))}</View>
          <Text style={styles.section}>My Tags</Text>
          <View style={styles.tagRow}>{userTags.map((t) => renderTag(t, true))}</View>
          <View style={styles.customRow}>
            <TextInput
              style={styles.input}
              placeholder="Create custom tag"
              placeholderTextColor="#999"
              value={custom}
              onChangeText={setCustom}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCustom}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
            <TouchableOpacity style={styles.done} onPress={onClose}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
            {showConfetti && (
              <ConfettiCannon
                count={20}
                origin={{ x: 160, y: 0 }}
                fadeOut
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    color: '#111',
  },
  scroll: { paddingBottom: 40 },
  section: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tagWrapper: { margin: 2 },
  tag: {
    backgroundColor: '#E5E5EA',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  tagSelected: { backgroundColor: '#3b82f6' },
  tagText: { color: '#111' },
  tagTextSelected: { color: '#fff' },
  highlight: {
    backgroundColor: '#fde68a',
    borderRadius: 3,
  },
  customRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    color: '#111',
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  done: { alignSelf: 'center', marginTop: 16 },
  doneText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
});
