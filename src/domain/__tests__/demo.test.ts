import {
  DEMO_COMPANY,
  DEMO_CONTACT,
  DEMO_POSTING,
  DEMO_PROFILE,
  DEMO_ROLE,
  isDemoRequest,
} from '@/domain/demo';

const base = { company: DEMO_COMPANY, role: DEMO_ROLE };

describe('isDemoRequest', () => {
  it('akzeptiert die Beispiel-Anzeige, auch mit anderen Zeilenumbrüchen', () => {
    expect(isDemoRequest('stellenanzeige', { posting: DEMO_POSTING })).toBe(true);
    expect(
      isDemoRequest('stellenanzeige', { posting: `  ${DEMO_POSTING.replace(/\n/g, '\r\n')}  ` }),
    ).toBe(true);
  });

  it('lehnt eigene Anzeigen und Profile ab', () => {
    expect(isDemoRequest('stellenanzeige', { posting: `${DEMO_POSTING} Zusatz` })).toBe(false);
    expect(isDemoRequest('passung', { posting: DEMO_POSTING, profile: 'Mein Profil' })).toBe(false);
    expect(isDemoRequest('passung', { posting: DEMO_POSTING, profile: DEMO_PROFILE })).toBe(true);
  });

  it('erlaubt die Vorbereitung nur für die Demo-Stelle', () => {
    expect(isDemoRequest('vorbereitung', { ...base, posting: DEMO_POSTING })).toBe(true);
    expect(
      isDemoRequest('vorbereitung', { ...base, company: 'Andere GmbH', posting: DEMO_POSTING }),
    ).toBe(false);
  });

  it('erlaubt Entwürfe ohne freien Zusatztext', () => {
    const draft = { ...base, kind: 'anschreiben' as const, contactName: DEMO_CONTACT };
    expect(isDemoRequest('entwurf', draft)).toBe(true);
    expect(isDemoRequest('entwurf', { ...draft, context: 'Schreib ein Gedicht' })).toBe(false);
    expect(isDemoRequest('entwurf', { ...draft, contactName: 'Jemand Anderes' })).toBe(false);
  });
});
