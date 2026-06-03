import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const colors = {
  bg: '#f4fbf7',
  panel: '#ffffff',
  ink: '#1c2b2a',
  muted: '#6b7d7a',
  line: '#dcebe5',
  mint: '#24b87a',
  mintDark: '#128454',
  mintSoft: '#dff8ec',
  skySoft: '#e4f3ff',
  coralSoft: '#ffe8e3',
  gold: '#f5b83d',
};

const phrasebook = [
  { language: 'Spanish', prompt: 'I drink water', answer: 'yo bebo agua', focus: 'Basics 1' },
  { language: 'Spanish', prompt: 'Bread, please', answer: 'pan por favor', focus: 'Food' },
  { language: 'Hebrew', prompt: 'I drink water', answer: 'אני שותה מים', focus: 'Alef-Bet' },
  { language: 'Hebrew', prompt: 'Bread, please', answer: 'לחם בבקשה', focus: 'Food' },
];

const milestones = [
  { icon: 'flag', title: 'Basics', detail: 'First translation path and core food words.' },
  { icon: 'directions-car', title: 'Travel', detail: 'Station, beach, taxi, and location prompts.' },
  { icon: 'menu-book', title: 'Story', detail: 'Short cafe scenes that unlock after travel.' },
  { icon: 'workspace-premium', title: 'Checkpoint', detail: 'A final review gate for the current course.' },
] as const;

export default function GuideScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialIcons name="map" size={28} color="#ffffff" />
        </View>
        <View style={styles.flexShrink}>
          <Text selectable style={styles.title}>
            Course Guide
          </Text>
          <Text selectable style={styles.muted}>
            Spanish and Hebrew paths share the same lesson rhythm, so progress feels familiar while the script and vocabulary change.
          </Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text selectable style={styles.sectionTitle}>
          Trail Milestones
        </Text>
        <View style={styles.milestoneGrid}>
          {milestones.map((item) => (
            <View key={item.title} style={styles.milestoneCard}>
              <View style={styles.smallIcon}>
                <MaterialIcons name={item.icon} size={20} color={colors.mintDark} />
              </View>
              <Text selectable style={styles.cardTitle}>
                {item.title}
              </Text>
              <Text selectable style={styles.cardCopy}>
                {item.detail}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text selectable style={styles.sectionTitle}>
          Phrasebook
        </Text>
        {phrasebook.map((item) => (
          <View key={`${item.language}-${item.prompt}`} style={styles.phraseRow}>
            <View style={styles.phraseMeta}>
              <Text selectable style={styles.badge}>
                {item.language}
              </Text>
              <Text selectable style={styles.focus}>
                {item.focus}
              </Text>
            </View>
            <View style={styles.flexShrink}>
              <Text selectable style={styles.prompt}>
                {item.prompt}
              </Text>
              <Text selectable style={[styles.answer, item.language === 'Hebrew' && styles.rtl]}>
                {item.answer}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: '0 14px 32px rgba(30, 84, 69, 0.10)',
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  flexShrink: {
    flexShrink: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: '0 18px 45px rgba(30, 84, 69, 0.12)',
    gap: 14,
    padding: 16,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  milestoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  milestoneCard: {
    backgroundColor: '#f8fcfa',
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 150,
    flexGrow: 1,
    gap: 8,
    minHeight: 140,
    padding: 12,
  },
  smallIcon: {
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  cardCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  phraseRow: {
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  phraseMeta: {
    gap: 6,
    width: 86,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.skySoft,
    borderRadius: 8,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  focus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  prompt: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  answer: {
    color: colors.mintDark,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  rtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
