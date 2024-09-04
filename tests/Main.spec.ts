import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Main', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Main');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    let owner: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        owner = await blockchain.treasury('owner');
        user = await blockchain.treasury('user');

        main = blockchain.openContract(Main.createFromConfig({
            owner: owner.address
        }, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // to deploy
    });

    it('should accept funds', async () => {
        const sendAcceptFundsResult = await main.sendAcceptFunds
            (user.getSender(), toNano("2"));
            
        expect(sendAcceptFundsResult.transactions).toHaveTransaction({
            from: user.address,
            to: main.address,
            success: true,
            op: 0xa4d8086f,
            value: toNano("2"),
        });
    });

    it('should accept funds < 2 ton', async () => {
        const sendAcceptFundsResult = await main.sendAcceptFunds
            (user.getSender(), toNano("1"));

        expect(sendAcceptFundsResult.transactions).toHaveTransaction({
            from: user.address,
            to: main.address,
            success: false,
            op: 0xa4d8086f,
            exitCode: 101,
            value: toNano("1"),
        });
    });

    it('should lock/unlock admin', async () => {
        expect(await main.getIsLocked()).toEqual(0);
        const sendLockResult = await main.sendLock(owner.getSender());
        
        expect(sendLockResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: 0x878f9b0e
        });

        expect(await main.getIsLocked()).toEqual(1);

        const sendUnlockResult = await main.sendUnlock(owner.getSender());
        
        expect(sendUnlockResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: 0x6ae4b0ef
        });

        expect(await main.getIsLocked()).toEqual(0);
    });

    it('should lock/unlock random user', async () => {
        const sendLockResult = await main.sendLock(user.getSender());
        
        expect(sendLockResult.transactions).toHaveTransaction({
            from: user.address,
            to: main.address,
            success: false,
            op: 0x878f9b0e,
            exitCode: 401
        });

        const sendUnlockResult = await main.sendUnlock(user.getSender());
        
        expect(sendUnlockResult.transactions).toHaveTransaction({
            from: user.address,
            to: main.address,
            success: false,
            op: 0x6ae4b0ef,
            exitCode: 401
        });
    });

    it('should withdraw admin', async () => {
        const sendAdminWithdraw = await main.sendAdminWithdraw
        (owner.getSender(), toNano("1"));
        
        expect(sendAdminWithdraw.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            outMessagesCount: 1,
            op: 0x217e5898
        });
    });

    it('should random user', async () => {
        const sendAdminWithdraw = await main.sendAdminWithdraw
        (user.getSender(), toNano("1"));
        
        expect(sendAdminWithdraw.transactions).toHaveTransaction({
            from: user.address,
            to: main.address,
            success: false,
            outMessagesCount: 1,
            op: 0x217e5898,
            exitCode: 401
        });
    });
});
