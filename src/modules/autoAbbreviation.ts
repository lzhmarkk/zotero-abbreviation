import {config} from "../../package.json";
import {getString} from "./locale";
import {load_rules} from "./rules";


export class UIExampleFactory {
    static registerRightClickUpdateAbbreviation() {
        const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
        // item menuitem with icon
        ztoolkit.Menu.register("item", {
            tag: "menuitem",
            id: "zotero-itemmenu-update-abbreviation",
            label: getString("menuitem.label"),
            commandListener: () => {
                ZoteroPane.getSelectedItems(true)
                    .map((id) => update_publish_abbreviation(id, true))
            },
            icon: menuIcon,
        });
    }

    static async registerPublishColumn() {
        await ztoolkit.ItemTree.register(
            "abbrev",
            getString("itemTree.abbrev"),
            (
                field: string,
                unformatted: boolean,
                includeBaseMapped: boolean,
                item: Zotero.Item
            ) => {
                if (item.itemType == "conferencePaper") {
                    const abbrev = item.getField('conferenceName')
                    return String(abbrev)
                } else if (item.itemType == "journalArticle") {
                    const abbrev = item.getField('journalAbbreviation')
                    return String(abbrev)
                } else {
                    return String("")
                }
            }
        );
    }
    static registerPrefs() {
        const prefOptions = {
            pluginID: config.addonID,
            src: rootURI + "chrome/content/preferences.xhtml",
            label: getString("prefs.title"),
            image: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
            extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
            defaultXUL: true,
        };
        ztoolkit.PreferencePane.register(prefOptions);
    }

    static async initRules() {
        if (!addon.data.rules) {
            addon.data.rules = {
                columns: [
                    {
                        dataKey: "full",
                        label: "prefs.table.full",
                    },
                    {
                        dataKey: "abbr",
                        label: "prefs.table.abbr",
                    },
                ],
                rows: await load_rules()
            }
        }
    }
}


function update_publish_abbreviation(
    itemId: number,
    skipIfExists: boolean = false) {
    const item = Zotero.Items.get(itemId);
    if (item?.isRegularItem()) {
        if (item.itemType == "conferencePaper") {
            const full_name = String(item.getField("proceedingsTitle"))
            const abbrev = String(get_publish_abbreviation(full_name))
            const old_value = String(item.getField("conferenceName"))
            if (abbrev && abbrev !== old_value) {
                item.setField("conferenceName", abbrev)
                item.saveTx()
            }
        } else if (item.itemType == "journalArticle") {
            const full_name = String(item.getField("publicationTitle"))
            const abbrev = get_publish_abbreviation(full_name)
            const old_value = String(item.getField("journalAbbreviation"))
            if (abbrev && abbrev !== old_value) {
                item.setField("journalAbbreviation", abbrev)
                item.saveTx()
            }
        }
    }
}

function get_publish_abbreviation(full_name: string) {
    // ignore some words
    const ignore_words = ['ACM', 'IEEE', 'Annual', 'CCF', 'of', 'on', 'for', 'and','\/']

    const removePatternsFromString = (S: string, patterns: string[]): string => {
        const regex = new RegExp(patterns.join('|').toLowerCase(), 'gi');
        return S.replace(regex, ' ');
    }
    const matchKeyWords = (S: string, words: string[]): boolean => words.every(w => S.toLowerCase().includes(w))

    const matchRow = (S: string, row: any): boolean => {
        if (!row.abbr) {
            return false;
        }
        if (row.words) {
            return matchKeyWords(full_name, row.words)
        } else {
            const words = removePatternsFromString(row.full.toLowerCase(), ignore_words).split(' ')
            row.words = words
            //todo test words cache
            return matchKeyWords(full_name, words)
        }
    }

    const rules = addon.data.rules?.rows!
    const matched = rules?.filter(row => matchRow(full_name, row))
    if (matched && matched.length > 0) {
        // todo user select manually if matched.length>0
        return String(matched[0].abbr)
    } else {
        return String("")
    }
}