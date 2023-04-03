import { config } from "../../package.json";
import { getString } from "./locale";
import {load_rules, add_rule, del_rule, reset_rules} from "./rules";

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/chrome/content/preferences.xul onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
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
      rows: await load_rules(),
      buffer: {}
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
}

async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window!)
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: addon.data.prefs?.columns.map((column) =>
        Object.assign(column, {
          label: getString(column.label) || column.label,
        })
      ),
      showHeader: true,
      multiSelect: true,
      staticColumns: true,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.prefs?.rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        addon.data.prefs?.rows[index] || {
          full: "no data",
          abbr: "no data",
        }
    )
    // Show a progress window when selection changes
    .setProp("onSelectionChange", (selection) => {
      // new ztoolkit.ProgressWindow(config.addonName)
      //   .createLine({
      //     text: `Selected line: ${addon.data.prefs?.rows
      //       .filter((v, i) => selection.isSelected(i))
      //       .map((row) => row.abbr)
      //       .join(",")}`,
      //     progress: 100,
      //   })
      //   .show();
    })
    // When pressing delete, delete selected line and refresh table.
    // Returning false to prevent default event.
    .setProp("onKeyDown", (event: KeyboardEvent) => {
      if (event.key == "Delete" || (Zotero.isMac && event.key == "Backspace")) {
        addon.data.prefs!.rows =
          addon.data.prefs?.rows.filter(
            (v, i) => !tableHelper.treeInstance.selection.isSelected(i)
          ) || [];
        tableHelper.render();
        return false;
      }
      return true;
    })
    // For find-as-you-type
    .setProp(
      "getRowString",
      (index) => addon.data.prefs?.rows[index].abbr || ""
    )
    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  addon.data.prefs!.table = tableHelper;
  await renderLock.promise;
  ztoolkit.log("Preference table rendered!");
}

function bindPrefEvents() {
    addon.data.prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-addRule`)
      ?.addEventListener("click", (e) => {
        const fullInput = <HTMLInputElement>addon.data.prefs!!.window.document.getElementById("zotero-prefpane-ZoteroAbbrev-full");
        const abbrInput = <HTMLInputElement>addon.data.prefs!!.window.document.getElementById("zotero-prefpane-ZoteroAbbrev-abbr");
        const full = fullInput.value;
        const abbr = abbrInput.value;

        if(!full||!abbr){
            addon.data.prefs!.window.alert(getString("prefs.table.warn"));
            return false;
        }

        const rule = {
                full: full,
                abbr: abbr
            };
        add_rule(rule);
          fullInput.value = "";
          abbrInput.value = "";
          addon.data.prefs!.table?.render();
          return false;
      });

    addon.data.prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-removeRule`)
        ?.addEventListener("click", (e) => {
            const table = addon.data.prefs!.table;
            if(!!table) {
                 const rules=addon.data.prefs?.rows.filter(
                        (v, i) => !table.treeInstance.selection.isSelected(i)
                    ) || [];
                 del_rule(rules);
                table.render();
            }
            return false;
        });

    addon.data.prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-resetRule`)
        ?.addEventListener("click", (e) => {
            const table = addon.data.prefs!.table;
            if(!!table){
                reset_rules();
                table.render();
            }
            return false;
        });
}
