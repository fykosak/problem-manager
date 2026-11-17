import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['.react-router/', 'build/'],
	},
	eslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/switch-exhaustiveness-check': [
				'error',
				{
					considerDefaultExhaustiveForUnions: true,
				},
			],
		},
	}
);
