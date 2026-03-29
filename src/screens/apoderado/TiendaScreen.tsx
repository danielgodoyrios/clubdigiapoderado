import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import {
  Tienda, ProductoTienda, SolicitudTienda, SolicitudTiendaItem,
} from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

type CarritoItem = SolicitudTiendaItem & { nombre: string; precio: number };

type Vista = 'catalogo' | 'carrito' | 'solicitudes';

// ── Formatea precio CLP ────────────────────────────────────────
function fmtPrecio(n: number): string {
  return `$${n.toLocaleString('es-CL')}`;
}

// ── Tarjeta de producto ────────────────────────────────────────
function ProductoCard({
  prod,
  onAdd,
}: {
  prod: ProductoTienda;
  onAdd: (prod: ProductoTienda, talla?: string) => void;
}) {
  const hasTallas = prod.tallas && prod.tallas.length > 0;
  const [tallaSeleccionada, setTalla] = useState<string | undefined>(undefined);

  return (
    <View style={styles.prodCard}>
      {prod.imagen_url ? (
        <Image source={{ uri: prod.imagen_url }} style={styles.prodImg} resizeMode="cover" />
      ) : (
        <View style={[styles.prodImg, styles.prodImgPlaceholder]}>
          <Ionicons name="shirt-outline" size={28} color={Colors.gray} />
        </View>
      )}
      <View style={{ flex: 1, padding: 10 }}>
        <Text style={styles.prodNombre}>{prod.nombre}</Text>
        <Text style={styles.prodDesc} numberOfLines={2}>{prod.descripcion}</Text>
        <Text style={styles.prodPrecio}>{fmtPrecio(prod.precio)}</Text>

        {hasTallas && (
          <View style={styles.tallasRow}>
            {(prod.tallas ?? []).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tallaBtn, tallaSeleccionada === t && styles.tallaBtnActive]}
                onPress={() => setTalla(t)}
              >
                <Text style={[styles.tallaTxt, tallaSeleccionada === t && styles.tallaTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.addBtn, prod.stock === 0 && styles.addBtnDisabled]}
          disabled={prod.stock === 0 || (hasTallas && !tallaSeleccionada)}
          onPress={() => onAdd(prod, tallaSeleccionada)}
        >
          <Text style={styles.addTxt}>
            {prod.stock === 0 ? 'Sin stock' : hasTallas && !tallaSeleccionada ? 'Elige talla' : 'Agregar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Ítem de carrito ────────────────────────────────────────────
function CarritoRow({
  item,
  onRemove,
  onQty,
}: {
  item: CarritoItem;
  onRemove: () => void;
  onQty: (q: number) => void;
}) {
  return (
    <View style={styles.carritoRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.carritoNombre}>{item.nombre}</Text>
        {item.talla && <Text style={styles.carritoSub}>Talla: {item.talla}</Text>}
        <Text style={styles.carritoPrecio}>{fmtPrecio(item.precio * item.cantidad)}</Text>
      </View>
      <View style={styles.qtyRow}>
        <TouchableOpacity onPress={() => onQty(item.cantidad - 1)} style={styles.qtyBtn}>
          <Ionicons name="remove" size={16} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.qtyTxt}>{item.cantidad}</Text>
        <TouchableOpacity onPress={() => onQty(item.cantidad + 1)} style={styles.qtyBtn}>
          <Ionicons name="add" size={16} color={Colors.dark} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onRemove} style={{ padding: 6 }}>
        <Ionicons name="trash-outline" size={18} color={Colors.red} />
      </TouchableOpacity>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────
export default function TiendaScreen({ navigation }: any) {
  const { state } = useAuth();
  const clubId = state.status === 'authenticated' ? state.user.club_id : 0;
  const hijoId = state.status === 'authenticated' ? state.activePupil?.id ?? 0 : 0;

  const [vista, setVista]               = useState<Vista>('catalogo');
  const [catalogo, setCatalogo]         = useState<ProductoTienda[]>([]);
  const [solicitudes, setSolicitudes]   = useState<SolicitudTienda[]>([]);
  const [carrito, setCarrito]           = useState<CarritoItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [enviando, setEnviando]         = useState(false);

  const loadCatalogo = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await Tienda.catalogo(clubId);
      setCatalogo(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  const loadSolicitudes = useCallback(async () => {
    try {
      const data = await Tienda.misSolicitudes();
      setSolicitudes(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadCatalogo();
    loadSolicitudes();
  }, [loadCatalogo, loadSolicitudes]));

  // ── Carrito logic ──────────────────────────────────────────
  const addToCarrito = (prod: ProductoTienda, talla?: string) => {
    setCarrito(prev => {
      const existing = prev.findIndex(i => i.producto_id === prod.id && i.talla === talla);
      if (existing >= 0) {
        return prev.map((i, idx) => idx === existing ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { producto_id: prod.id, cantidad: 1, talla, nombre: prod.nombre, precio: prod.precio }];
    });
    Alert.alert('', `${prod.nombre} agregado al carrito`, [{ text: 'OK' }]);
  };

  const removeFromCarrito = (idx: number) => {
    setCarrito(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) { removeFromCarrito(idx); return; }
    setCarrito(prev => prev.map((i, n) => n === idx ? { ...i, cantidad: qty } : i));
  };

  const totalCarrito = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const handleEnviarSolicitud = async () => {
    if (carrito.length === 0) return;
    setEnviando(true);
    try {
      await Tienda.crearSolicitud({
        hijo_id: hijoId,
        items: carrito.map(({ producto_id, cantidad, talla }) => ({ producto_id, cantidad, talla })),
      });
      setCarrito([]);
      await loadSolicitudes();
      Alert.alert('Solicitud enviada', 'El club recibirá tu solicitud.', [
        { text: 'OK', onPress: () => setVista('solicitudes') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (sol: SolicitudTienda) => {
    if (sol.acusado_at) {
      Alert.alert('No se puede eliminar', 'El club ya acusó recibo de esta solicitud.');
      return;
    }
    Alert.alert('Eliminar solicitud', '¿Confirmas que deseas eliminar esta solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await Tienda.eliminarSolicitud(sol.id);
            await loadSolicitudes();
          } catch (err: any) {
            if (err?.status === 403) {
              Alert.alert('No se puede eliminar', 'El club ya acusó recibo.');
            } else {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          }
        },
      },
    ]);
  };

  // ── Header ─────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: BLUE }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ic}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Tienda</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={() => setVista('carrito')} style={styles.ic}>
        <Ionicons name="cart-outline" size={22} color="#fff" />
        {carrito.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeTxt}>{carrito.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setVista('solicitudes')} style={styles.ic}>
        <Ionicons name="list-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // ── Vista: Catálogo ────────────────────────────────────────
  if (vista === 'catalogo') {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={BLUE} />
        ) : (
          <FlatList
            data={catalogo}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCatalogo(true)} tintColor={BLUE} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="bag-outline" size={40} color={Colors.gray} />
                <Text style={styles.emptyTxt}>No hay productos disponibles</Text>
              </View>
            }
            renderItem={({ item }) => (
              <ProductoCard prod={item} onAdd={addToCarrito} />
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Vista: Carrito ─────────────────────────────────────────
  if (vista === 'carrito') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.headerRow, { backgroundColor: BLUE }]}>
          <TouchableOpacity onPress={() => setVista('catalogo')} style={styles.ic}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carrito</Text>
        </View>
        {carrito.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={40} color={Colors.gray} />
            <Text style={styles.emptyTxt}>El carrito está vacío</Text>
            <TouchableOpacity onPress={() => setVista('catalogo')} style={styles.volverBtn}>
              <Text style={styles.volverTxt}>Ver catálogo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={carrito}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item, index }) => (
                <CarritoRow
                  item={item}
                  onRemove={() => removeFromCarrito(index)}
                  onQty={q => updateQty(index, q)}
                />
              )}
            />
            <View style={styles.totalBar}>
              <Text style={styles.totalLbl}>Total</Text>
              <Text style={styles.totalVal}>{fmtPrecio(totalCarrito)}</Text>
            </View>
            <TouchableOpacity style={styles.enviarBtn} onPress={handleEnviarSolicitud} disabled={enviando}>
              {enviando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.enviarTxt}>Enviar solicitud</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    );
  }

  // ── Vista: Mis solicitudes ─────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.headerRow, { backgroundColor: BLUE }]}>
        <TouchableOpacity onPress={() => setVista('catalogo')} style={styles.ic}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis solicitudes</Text>
      </View>
      <FlatList
        data={solicitudes}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={Colors.gray} />
            <Text style={styles.emptyTxt}>Sin solicitudes aún</Text>
          </View>
        }
        renderItem={({ item: sol }) => (
          <View style={styles.solCard}>
            <View style={styles.cardRow}>
              <View style={[styles.solBadge, { backgroundColor: sol.acusado_at ? Colors.ok + '20' : Colors.amber + '20' }]}>
                <Text style={[styles.solBadgeTxt, { color: sol.acusado_at ? Colors.green : Colors.amber }]}>
                  {sol.acusado_at ? 'Acusado' : 'Pendiente'}
                </Text>
              </View>
              <Text style={styles.solFecha}>{new Date(sol.created_at).toLocaleDateString('es-CL')}</Text>
            </View>
            {sol.items.map((it, idx) => (
              <Text key={idx} style={styles.solItem}>• {it.nombre} × {it.cantidad}{it.talla ? ` (${it.talla})` : ''}</Text>
            ))}
            {!sol.acusado_at && (
              <TouchableOpacity style={styles.eliminarBtn} onPress={() => handleEliminar(sol)}>
                <Ionicons name="trash-outline" size={14} color={Colors.red} />
                <Text style={styles.eliminarTxt}>Eliminar solicitud</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.surf },
  headerRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  ic:            { padding: 6 },
  headerTitle:   { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 6 },
  cartBadge:     { position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.red, alignItems: 'center', justifyContent: 'center' },
  cartBadgeTxt:  { color: '#fff', fontSize: 8, fontWeight: '800' },
  prodCard:      { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', elevation: 1 },
  prodImg:       { width: 100, height: 100 },
  prodImgPlaceholder: { backgroundColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  prodNombre:    { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  prodDesc:      { fontSize: 12, color: Colors.gray, marginBottom: 4 },
  prodPrecio:    { fontSize: 15, fontWeight: '800', color: BLUE, marginBottom: 6 },
  tallasRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  tallaBtn:      { borderWidth: 1, borderColor: Colors.light, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tallaBtnActive:{ borderColor: BLUE, backgroundColor: BLUE + '14' },
  tallaTxt:      { fontSize: 11, color: Colors.dark },
  tallaTxtActive:{ color: BLUE, fontWeight: '700' },
  addBtn:        { backgroundColor: BLUE, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  addBtnDisabled:{ backgroundColor: Colors.gray },
  addTxt:        { color: '#fff', fontSize: 12, fontWeight: '700' },
  carritoRow:    { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  carritoNombre: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  carritoSub:    { fontSize: 11, color: Colors.gray },
  carritoPrecio: { fontSize: 14, fontWeight: '800', color: BLUE, marginTop: 2 },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
  qtyBtn:        { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  qtyTxt:        { fontSize: 14, fontWeight: '700', color: Colors.dark, minWidth: 20, textAlign: 'center' },
  totalBar:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.light },
  totalLbl:      { fontSize: 14, fontWeight: '600', color: Colors.gray },
  totalVal:      { fontSize: 18, fontWeight: '800', color: Colors.dark },
  enviarBtn:     { margin: 16, backgroundColor: BLUE, borderRadius: 12, padding: 16, alignItems: 'center' },
  enviarTxt:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  solCard:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  solBadge:      { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  solBadgeTxt:   { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  solFecha:      { fontSize: 12, color: Colors.gray, marginLeft: 'auto' },
  solItem:       { fontSize: 13, color: Colors.mid, marginBottom: 2 },
  eliminarBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.light },
  eliminarTxt:   { color: Colors.red, fontSize: 12, fontWeight: '600' },
  volverBtn:     { marginTop: 16, backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  volverTxt:     { color: '#fff', fontWeight: '700' },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyTxt:      { color: Colors.gray, fontSize: 14 },
});
