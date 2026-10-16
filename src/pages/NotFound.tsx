import type * as React from "react";
import { Link } from "react-router-dom";
import { Tanker } from "../components/Illustrations";
import { Button } from "../components/ui/Button";

const NotFound: React.FC = () => (
  <div className="grid min-h-[50vh] place-items-center text-center">
    <div className="flex flex-col items-center gap-3">
      <Tanker size={140} className="animate-drift" />
      <h1 className="font-display text-4xl font-extrabold">Wrong route</h1>
      <p className="max-w-sm text-mute">This tanker could not find the page you asked for.</p>
      <Link to="/"><Button>Back to dashboard</Button></Link>
    </div>
  </div>
);

export default NotFound;
