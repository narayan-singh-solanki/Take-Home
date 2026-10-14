import { searchCatalog } from '../src/domain/catalog/searchCatalog';
import { catalog } from '../src/data/catalog/catalog';

describe('Search Catalog Domain', () => {
  it('returns empty array when query is empty or whitespace', () => {
    expect(searchCatalog(catalog, '')).toEqual([]);
    expect(searchCatalog(catalog, '   ')).toEqual([]);
  });

  it('searches medicines case-insensitively by name', () => {
    const results = searchCatalog(catalog, 'dolo');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Dolo 650');

    const uppercaseResults = searchCatalog(catalog, 'DOLO');
    expect(uppercaseResults).toHaveLength(1);
    expect(uppercaseResults[0].id).toBe('m1');
  });

  it('searches medicines case-insensitively by salt', () => {
    // Paracetamol is in Dolo 650, Crocin Advance, Calpol 500, Cheston Cold
    const results = searchCatalog(catalog, 'paracetamol');
    expect(results.length).toBeGreaterThanOrEqual(3);
    const names = results.map((m) => m.name);
    expect(names).toContain('Dolo 650');
    expect(names).toContain('Crocin Advance');
    expect(names).toContain('Calpol 500');
  });

  it('returns empty array when no medicine or salt matches', () => {
    const results = searchCatalog(catalog, 'xyznonexistent123');
    expect(results).toEqual([]);
  });
});

