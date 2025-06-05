import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { defaultTags, getUserTags, addUserTag } from './utils/tags';

export default function TagSelectorModal({
  visible,
  onClose,
  selectedTags,
  toggleTag,
}) {
  const [userTags, setUserTags] = useState([]);
  const [search, setSearch] = useState('');
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (visible) {
      getUserTags().then(setUserTags);
    }
  }, [visible]);

  const handleAddCustom = async () => {
    const updated = await addUserTag(custom);
    setUserTags(updated);
    if (custom.trim()) toggleTag(custom.trim());
    setCustom('');
  };

  const renderTag = (tag) => {
    if (search && !tag.toLowerCase().includes(search.toLowerCase())) return null;
    const selected = selectedTags.includes(tag);
    return (
      <TouchableOpacity
        key={tag}
        style={[styles.tag, selected && styles.tagSelected]}
        onPress={() => toggleTag(tag)}
      >
        <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide">
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
          <View style={styles.tagRow}>{defaultTags.emotions.map(renderTag)}</View>
          <Text style={styles.section}>Activities</Text>
          <View style={styles.tagRow}>{defaultTags.activities.map(renderTag)}</View>
          <Text style={styles.section}>Themes</Text>
          <View style={styles.tagRow}>{defaultTags.themes.map(renderTag)}</View>
          <Text style={styles.section}>My Tags</Text>
          <View style={styles.tagRow}>{userTags.map(renderTag)}</View>
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
      </View>
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
