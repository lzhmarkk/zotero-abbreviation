
export function add_rule(rule: { [dataKey: string]: string; }) {
    //todo duplicate check
    ztoolkit.log("add rules")
    let rules = addon.data.prefs!.rows;
    rules.push(rule);
    Zotero.Prefs.set("zoteroabbr.rules", JSON.stringify(rules));
    return JSON.parse(<string>Zotero.Prefs.get("zoteroabbr.rules"));
}

export function del_rule(rules: { [dataKey: string]: string; }[]) {
    ztoolkit.log("remove rules")
    addon.data.prefs!.rows = rules;
    Zotero.Prefs.set("zoteroabbr.rules", JSON.stringify(rules));
    return JSON.parse(<string>Zotero.Prefs.get("zoteroabbr.rules"));
}

