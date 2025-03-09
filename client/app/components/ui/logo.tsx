import LogoBlack from '@client/assets/logoFullBlack.svg';
import LogoWhite from '@client/assets/logoFullWhite.svg';
import { useTheme } from '@client/hooks/themeProvider';
import { cn } from '@client/lib/utils';
import { cva } from 'class-variance-authority';

const logoVariants = cva('');

export default function Logo({ className }: { className?: string }) {
	const { usedColor } = useTheme();

	const logoColor = usedColor === 'dark' ? LogoWhite : LogoBlack;

	return <img src={logoColor} className={cn(logoVariants(), className)} />;
}
