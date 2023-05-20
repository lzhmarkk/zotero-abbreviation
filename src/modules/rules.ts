export async function load_rules() {
    ztoolkit.log("load rules")
    // Set default if not set.
    if (Zotero.Prefs.get("zoteroabbr.rules") === undefined) {
        ztoolkit.log("rules not exist, load defaults from file")
        const default_rules = await default_rules_list()
        Zotero.Prefs.set("zoteroabbr.rules", JSON.stringify(default_rules))
    }
    return JSON.parse(<string>Zotero.Prefs.get("zoteroabbr.rules"));
}

export function add_rule(rule: { [dataKey: string]: string; }) {
    //todo duplicate check
    ztoolkit.log("add rules")
    let rules = addon.data.rules!.rows;
    rules.push(rule);
    Zotero.Prefs.set("zoteroabbr.rules", JSON.stringify(rules));
    return JSON.parse(<string>Zotero.Prefs.get("zoteroabbr.rules"));
}

export function del_rule(rules: { [dataKey: string]: string; }[]) {
    ztoolkit.log("remove rules")
    addon.data.rules!.rows = rules;
    Zotero.Prefs.set("zoteroabbr.rules", JSON.stringify(rules));
    return JSON.parse(<string>Zotero.Prefs.get("zoteroabbr.rules"));
}

export async function reset_rules() {
    ztoolkit.log("reset rules to defaults from file")
    const default_rules = await default_rules_list()
    addon.data.rules!.rows = default_rules;
    Zotero.Prefs.set("zoteroabbr.rules", JSON.stringify(default_rules))
    return JSON.parse(<string>Zotero.Prefs.get("zoteroabbr.rules"));
}

export async function default_rules_list() {
    const uri = rootURI + "chrome/content/default_rules.csv";
    ztoolkit.log(`load default rules from URI: ${uri}`);
    const xhr = <string | XMLHttpRequest>await Zotero.File.getContentsAsync(uri, 'utf-8');
    const data = typeof xhr === "string" ? xhr : <string>xhr.response;
    ztoolkit.log(`loaded default rules: ${data}`);

    const lines = data.split('\n');
    return lines.map(line => {
        line = line.replace('\r', '')
        const sp = line.split(',')
        const abbr = sp[0]
        const full = sp.splice(1).join(',')
        return {
            "abbr": abbr,
            "full": full
        }
    })
}

function clear_rules() {
    Zotero.Prefs.clear("zoteroabbr.rules");
}