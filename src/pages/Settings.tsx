import type * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Field, Input, Segmented } from "../components/ui/Fields";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";

const Settings: React.FC = () => {
  const { settings, setSettings } = useData();
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <PageHeader title="Settings" subtitle="Theme, plant name and the quality limits used for alerts." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appearance" subtitle="Pick the look that is easier on your eyes." />
          <div className="p-5 sm:p-6">
            <Segmented value={theme} onChange={setTheme} options={[{ value: "light", label: <span className="inline-flex items-center gap-2"><Sun size={15} />Light</span> }, { value: "dark", label: <span className="inline-flex items-center gap-2"><Moon size={15} />Dark</span> }]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Plant and limits" subtitle="Shown in the header and used by the Quality lab." />
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <Field label="Plant name" className="sm:col-span-2"><Input value={settings.plant} onChange={(e) => setSettings({ ...settings, plant: e.target.value })} /></Field>
            <Field label="Minimum fat %"><Input type="number" step="0.1" value={settings.minFat} onChange={(e) => setSettings({ ...settings, minFat: Number(e.target.value) })} /></Field>
            <Field label="Minimum SNF %"><Input type="number" step="0.1" value={settings.minSnf} onChange={(e) => setSettings({ ...settings, minSnf: Number(e.target.value) })} /></Field>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
