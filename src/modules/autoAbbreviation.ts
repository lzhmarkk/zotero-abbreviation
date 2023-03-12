import {config} from "../../package.json";
import {getString} from "./locale";


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

function get_publish_abbreviation(full_name: String) {
    const rules = addon.data.prefs?.rows
    const _abb = rules?.filter((t) => full_name.toLowerCase().includes(t.full.toLowerCase()))
    if (!!_abb && _abb.length > 0) {
        return String(_abb[0].abbr)
    } else {
        return String("")
    }
}