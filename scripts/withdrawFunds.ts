import { toNano, Address } from '@ton/core';
import { Main } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    try {
        const main = provider.open(Main.createFromConfig({
            owner: provider.sender().address as Address
        }, await compile('Main')));

        await main.sendAdminWithdraw(provider.sender(), toNano("0.02"));
        await provider.waitForDeploy(main.address);

        console.log('Change owner request sent');
    } catch (error) {
        console.error('Failed to change owner:', error);
    }
}