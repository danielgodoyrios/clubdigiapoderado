import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import { InboxAPI, InboxNotif } from '../../api';

const BLUE = Colors.blue;

const TYPE_ICON: Record<string, { name: string; color: string }> = {
  pago:           { name: 'card-outline',            color: '#D97706' },
  comunicado:     { name: 'chatbubble-outline',       color: BLUE      },
  justificativo:  { name: 'document-text-outline',   color: '#6D28D9' },
  documento:      { name: 'folder-open-outline',     color: '#0891B2' },
  agenda:         { name: 'calendar-outline',         color: '#059669' },
  asistencia:     { name: 'clipboard-outline',        color: '#DC2626' },
  general:        { name: 'megaphone-outline',        color: Colors.gray },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60)   return 'Ahora';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

export const NotificacionesScreen: React.FC<any> = ({ navigation }) => {
  const [items, setItems]         = useState<InboxNotif[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await InboxAPI.list();
      setItems(data);
    } catch {
      // silently fail — keep existing list
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { load(); }, [load])
  );

  const handleTap = async (item: InboxNotif) => {
    if (!item.read) {
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
      InboxAPI.markRead(item.id).catch(() => {});
    }
    if (item.screen) {
      navigation.navigate(item.screen as any, item.params ?? {});
    }
  };

  const handleMarkAll = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await InboxAPI.markAllRead();
      setItems(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // silently fail
    } finally {
      setMarkingAll(false);
    }
  };

  const unread = items.filter(n => !n.read).length;

  const renderItem = ({ item }: { item: InboxNotif }) => {
    const ic = TYPE_ICON[item.type] ?? TYPE_ICON.general;
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: ic.color + '1A' }]}>
          <Ionicons name={ic.name as any} size={20} color={ic.color} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemRow}>
            <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.itemDate}>{fmtDate(item.created_at)}</Text>
          </View>
          <Text style={styles.itemText} numberOfLines={2}>{item.body}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unread > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll} disabled={markingAll}>
            {markingAll
              ? <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              : <Text style={styles.markAllTxt}>Marcar todas</Text>
            }
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={52} color={Colors.light} />
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>Aquí aparecerán los avisos del club.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => String(n.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[BLUE]}
              tintColor={BLUE}
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700', marginLeft: 4 },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  markAllTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.black },
  emptyText:  { fontSize: 13, color: Colors.gray, textAlign: 'center', paddingHorizontal: 40 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemUnread: { backgroundColor: '#EEF3FF' },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  itemBody: { flex: 1 },
  itemRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.black, marginRight: 8 },
  itemTitleUnread: { fontWeight: '700' },
  itemDate:  { fontSize: 11, color: Colors.gray, flexShrink: 0 },
  itemText:  { fontSize: 12, color: Colors.gray, lineHeight: 17 },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
    flexShrink: 0,
  },

  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
});
