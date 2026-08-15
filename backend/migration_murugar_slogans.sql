-- ============================================================
-- Murugar Slogans — Variant Options group
-- Run this AFTER migration_variant_options.sql has already been run once.
-- ============================================================
-- What this does:
--   1) Adds a new "Choose Your Slogan" variant options group with your
--      8 devotional lines + a 9th "Type your own" option.
--      Only the 9th option has the text box attached — if the customer
--      picks any of the 8 slogans, NO text box appears. The text box
--      only shows up if they pick "Type your own".
--   2) Assigns this group to every product inside the "Murugar Acrylic
--      Cases" and "Murugar Gold Cases" collections, so the dropdown
--      shows up automatically on those product pages (no need to set
--      it product-by-product in Admin > Products).
--
-- IMPORTANT: Check your exact collection names in Admin > Collections
-- before running this. If yours are named slightly differently (e.g.
-- "Murugan Gold Cases"), edit the two collection names in the WHERE
-- clauses below to match exactly, otherwise the assignment step won't
-- match any product.
-- ============================================================

UPDATE store_settings
SET settings_json = JSON_SET(
  settings_json,
  '$.variantGroups',
  JSON_ARRAY_APPEND(
    COALESCE(JSON_EXTRACT(settings_json, '$.variantGroups'), JSON_ARRAY()),
    '$',
    JSON_OBJECT(
      'id', 'murugar-slogans',
      'name', 'Choose Your Slogan',
      'options', JSON_ARRAY(
        JSON_OBJECT('id', 'ms1', 'label', 'யாமிருக்க பயமேன்.. ஆறுமுகம் அருளிடும் அனுதினமும் ஏறுமுகம்', 'isCustomText', false),
        JSON_OBJECT('id', 'ms2', 'label', 'ஓம் முருகா..', 'isCustomText', false),
        JSON_OBJECT('id', 'ms3', 'label', 'வேலுண்டு வினையில்லை', 'isCustomText', false),
        JSON_OBJECT('id', 'ms4', 'label', 'கந்தன் பாதம் கனவிலும் காக்கும்', 'isCustomText', false),
        JSON_OBJECT('id', 'ms5', 'label', 'கந்தன் கருணை', 'isCustomText', false),
        JSON_OBJECT('id', 'ms6', 'label', 'ஓம் சரவணபவ', 'isCustomText', false),
        JSON_OBJECT('id', 'ms7', 'label', 'வேலும் மயிலும் துணை', 'isCustomText', false),
        JSON_OBJECT('id', 'ms8', 'label', 'கருணைக் கடலே கந்தா போற்றி', 'isCustomText', false),
        JSON_OBJECT('id', 'ms9', 'label', 'Type your own text', 'isCustomText', true)
      )
    )
  )
)
WHERE id = 1;

-- Assign to products linked via the multi-collection table (product_collections)
UPDATE products p
JOIN product_collections pc ON pc.product_id = p.id
JOIN collections c ON c.id = pc.collection_id
SET p.variant_group_id = 'murugar-slogans'
WHERE c.name IN ('Murugar Acrylic Cases', 'Murugar Gold Cases');

-- Also cover products only set via the single collection_id column
UPDATE products p
JOIN collections c ON c.id = p.collection_id
SET p.variant_group_id = 'murugar-slogans'
WHERE c.name IN ('Murugar Acrylic Cases', 'Murugar Gold Cases');
