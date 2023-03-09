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
    const abbreviations = [
        ["Neural Information Processing Systems", "NIPS"],
        ["ACM Web Conference", "WWW"],
        ["Joint Conference on Artificial Intelligence", "IJCAI"],
        ["Transactions on Intelligent Transportation Systems", "TITS"],
        ["Conference on Machine Learning", "ICML"],
        ["SIGKDD", "KDD"],
        ["AAAI", "AAAI"],
        ["Knowledge-Based Systems", "KBS"],
        ["Transactions on Knowledge and Data Engineering", "TKDE"],
        ["Conference on Learning Representations", "ICLR"],
        ["Conference for Learning Representations", "ICLR"],
        ["SIGIR", "SIGIR"],
        ["Conference on Recommender Systems", "RecSys"],
        ["IEEE Access", "Access"],
        ["Conference on Information & Knowledge Management", "CIKM"],
        ["International Conference on Data Engineering", "ICDE"],
        ["Transactions on Intelligent Systems and Technology", "TIST"]
    ]
    const _abb = abbreviations.filter((t) => full_name.toLowerCase().includes(t[0].toLowerCase()))
    if (_abb.length > 0) {
        return String(_abb[0][1])
    } else {
        return String("")
    }
}