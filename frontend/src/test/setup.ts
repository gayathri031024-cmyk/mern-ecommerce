import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// CI runners are slower/shared, and the default 1000ms async timeout
// (findBy*, waitFor) is occasionally too tight there even for tests that
// pass reliably on a local machine. Give async assertions more headroom.
configure({ asyncUtilTimeout: 5000 });
