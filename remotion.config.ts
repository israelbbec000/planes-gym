import {Config} from '@remotion/cli/config';

// Los SVG, música y sfx viven en assets/ y se sirven con staticFile().
Config.setPublicDir('assets');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
