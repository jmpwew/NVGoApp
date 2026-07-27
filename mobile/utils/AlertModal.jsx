import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { C } from '../constants/colors';
import { IcCheck, IcX, IcAlert, IcInfo } from '../constants/icons';

// Reusable single-button alert dialog matching the app's own look, used
// instead of the native Alert.alert() for success / error / info messages.
//
// Usage:
//   const [alertInfo, setAlertInfo] = useState(null); // { title, message, tone, onOk } | null
//   const notify = (title, message, tone = 'error', onOk) =>
//     setAlertInfo({ title, message, tone, onOk });
//
//   <AlertModal
//     visible={!!alertInfo}
//     title={alertInfo?.title}
//     message={alertInfo?.message}
//     tone={alertInfo?.tone}
//     onClose={() => {
//       const cb = alertInfo?.onOk;
//       setAlertInfo(null);
//       if (cb) cb();
//     }}
//   />
const TONES = {
  success: { Icon: IcCheck, color: C.green, bg: C.greenLt },
  error:   { Icon: IcX,     color: C.red,   bg: C.redBg },
  warning: { Icon: IcAlert, color: C.yellowDk, bg: C.yellowBg },
  info:    { Icon: IcInfo,  color: C.skyDk, bg: C.skyBg },
};

export default function AlertModal({
  visible,
  title,
  message,
  buttonLabel = 'OK',
  tone = 'info', // 'success' | 'error' | 'warning' | 'info'
  onClose,
}) {
  const { Icon, color, bg } = TONES[tone] || TONES.info;

  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.card} onPress={() => {}}>
          <View style={[s.iconWrap, { backgroundColor: bg }]}>
            <Icon s={26} c={color} />
          </View>
          <Text style={s.title}>{title}</Text>
          {!!message && <Text style={s.message}>{message}</Text>}

          <TouchableOpacity
            style={[s.btn, { backgroundColor: color }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={s.btnTxt}>{buttonLabel}</Text>
          </TouchableOpacity>
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
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  btn: {
    marginTop: 20,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13.5,
  },
});
