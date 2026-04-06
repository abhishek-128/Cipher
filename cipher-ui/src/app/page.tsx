import path from 'path';
import fs from 'fs';
import DashboardClient from './DashboardClient';

export default function Page() {
  const inputPath = path.resolve(process.cwd(), '../sample_input.json');
  let sampleInput = null;
  
  try {
     const raw = fs.readFileSync(inputPath, 'utf-8');
     sampleInput = JSON.parse(raw);
  } catch(e) {
     console.error("Could not read sample_input.json");
  }

  return (
    <main>
      <DashboardClient initialPayload={sampleInput} />
    </main>
  );
}
