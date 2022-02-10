const CONSTANTS = require('../constants/constants');

const settings = CONSTANTS.DEFAULT_PARAMETERS.settings;
const settingsKerpak = CONSTANTS.DEFAULT_PARAMETERS.settingsKerpak;

module.exports = async (Gateways, IDBANK, tap, makeId, defaultOrder) => {
    tap.test(CONSTANTS.TEST_NAMES.REVERSE, async (tap) => {
        tap.test(CONSTANTS.TEST_NAMES.SETTINGS, async (tap) => {
            tap.test(CONSTANTS.TEST_NAMES.SETTINGS_WRONG, async (tap) => {
                const newSettings = { ...settings };
                newSettings.USER_NAME_API_BINDING = makeId(10);
                const client = Gateways.create(IDBANK, newSettings);
                const orderId = `tl${makeId(10)}`;
                const res = await client.reverseOrderProfile({ orderId });
                delete res.data.errorMessage;
                const comparableObj = {
                    ...CONSTANTS.ACCESS_DENIED,
                    errorStep: CONSTANTS.ERROR_STEPS.REVERSE_STEP,
                }

                tap.plan(1);
                tap.strictSame(res, comparableObj, CONSTANTS.MESSAGES.EQUIVALENT_STRICTLY);
                tap.end();
            });

            tap.test(CONSTANTS.TEST_NAMES.SETTINGS_FIELDS, async (tap) => {
                const newSettings = { ...settingsKerpak };
                delete newSettings.USER_NAME_API_BINDING;
                try {
                    Gateways.create(IDBANK, newSettings);
                } catch (err) {
                    tap.plan(2);
                    tap.equal(err.name, CONSTANTS.SETTINGS.NAME, CONSTANTS.MESSAGES.ERROR_NAME_EQUAL);
                    tap.ok(CONSTANTS.SETTINGS.MESSAGE.includes(err.message), CONSTANTS.MESSAGES.ERROR_MESSAGE_EQUAL);
                    tap.end();
                }
            });
            tap.end();
        });

        tap.test(CONSTANTS.TEST_NAMES.TIMEOUT, async (tap) => {
            const newSettings = { ...settings, TIMEOUT: 10 };
            const client = Gateways.create(IDBANK, newSettings);
            const orderId = `tl${makeId(10)}`;
            const res = await client.reverseOrderProfile({ orderId });

            tap.plan(2);
            tap.ok(res.hasError, CONSTANTS.MESSAGES.ERROR_EQUAL);
            tap.equal(res.err.name, CONSTANTS.TIMEOUT.MESSAGE, CONSTANTS.MESSAGES.ERROR_MESSAGE_EQUAL);
            tap.end();
        });

        tap.test(CONSTANTS.TEST_NAMES.ORDER_ID, async (tap) => {
            const client = Gateways.create(IDBANK, settings);
            const orderId = `tl${makeId(10)}`;
            const res = await client.reverseOrderProfile({ orderId });
            const comparableObj = {
                ...CONSTANTS.ORDER_NO_FOUND,
                errorStep: CONSTANTS.ERROR_STEPS.REVERSE_STEP
            }

            tap.plan(1);
            tap.strictSame(res, comparableObj, CONSTANTS.MESSAGES.EQUIVALENT_STRICTLY);
            tap.end();
        });

        tap.test(CONSTANTS.TEST_NAMES.SUCCESS, async (tap) => {
            const client = Gateways.create(IDBANK, settings);
            const order = { ...defaultOrder };
            order.orderNumber = `tl${makeId(10)}`;
            const resFreeze = await client.freezeOrder(order);
            const orderId = resFreeze.registerPreAuth.orderId;
            const res = await client.reverseOrderProfile({
                orderId,
                currency: resFreeze.data.currency,
                language: order.language,
            });

            const comparableOrder = {
                ...CONSTANTS.REVERSE_SUCCESS,
                data: {
                    ...res.data,
                    ...CONSTANTS.REVERSE_SUCCESS.data,
                    orderNumber: order.orderNumber,
                    amount: order.amount,
                    currency: order.currency,
                    clientId: order.clientId,
                    bindingId: order.bindingId,
                },
            }

            tap.plan(2);
            tap.strictSame(res, comparableOrder, CONSTANTS.MESSAGES.EQUIVALENT_STRICTLY);
            tap.test(CONSTANTS.TEST_NAMES.SAME_ORDER_ID, async (tap) => {
                const res = await client.reverseOrderProfile({
                    orderId,
                    currency: resFreeze.data.currency,
                    language: order.language,
                });

                tap.plan(1);
                tap.strictSame(res, CONSTANTS.REVERSE_SAME_ORDER_ID, CONSTANTS.MESSAGES.EQUIVALENT_STRICTLY);
            });
            tap.end();
        });
        tap.end();
    });
}