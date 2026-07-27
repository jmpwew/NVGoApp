import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { C } from '../constants/colors';

// Reusable confirmation dialog matching the app's own look, used instead of
// the native Alert.alert().
//
// Usage:
//   const [confirmCall, setConfirmCall] = useState(null); // { name, number } | null
//   <ConfirmModal
//     visible={!!confirmCall}
//     title={`Call ${confirmCall?.name}`}
//     message={`You are about to call ${confirmCall?.number}.`}
//     confirmLabel="Call Now"
//     onConfirm={() => { Linking.openURL(`tel:${confirmCall.number}`); setConfirmCall(null); }}
//     onCancel={() => setConfirmCall(null)}
//   />
export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default', // 'default' | 'danger'
  onConfirm,
  onCancel,
}) {
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.overlay} onPress={onCancel}>
        <Pressable style={s.card} onPress={() => {}}>
          <Text style={s.title}>{title}</Text>
          {!!message && <Text style={s.message}>{message}</Text>}

          <View style={s.actions}>
            <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={onCancel} activeOpacity={0.8}>
              <Text style={s.btnCancelTxt}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, tone === 'danger' ? s.btnDanger : s.btnConfirm]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={s.btnConfirmTxt}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,33,22,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  btnCancelTxt: {
    color: C.text,
    fontWeight: '700',
    fontSize: 13.5,
  },
  btnConfirm: {
    backgroundColor: C.green,
  },
  btnDanger: {
    backgroundColor: C.red,
  },
  btnConfirmTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13.5,
  },
});
