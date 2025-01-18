const {
    Client,
    GatewayIntentBits,
    Partials,
    PermissionsBitField,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ChannelType,
    EmbedBuilder
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel]
});

const userCreatedChannels = new Map();

// ID da categoria onde os canais devem ser criados (substitua pelo seu ID)
const CATEGORY_ID = '';

// Contador de canais criados
let channelCounter = 0;

client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '$painel') {
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('Painel para Criar Call')
            .setDescription('Para criar uma call, selecione o número de pessoas no menu abaixo.\n\nSeu canal será apagado após todos saírem dele.')
            .setFooter({ text: 'Bot feito por Kievzindcria' });

 
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_call_size')
                .setPlaceholder('Selecione o número de espaços na call')
                .addOptions([
                    { label: '2 Espaços', value: '2' },
                    { label: '3 Espaços', value: '3' },
                    { label: '4 Espaços', value: '4' },
                    { label: '5 Espaços', value: '5' },
                    { label: '10 Espaços', value: '10' },
                    { label: '15 Espaços', value: '15' },
                    { label: '20 Espaços', value: '20' },
                    { label: '25 Espaços', value: '25' },
                    { label: '30 Espaços', value: '30' },
                ])
        );


        await message.reply({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_call_size') {
        const userId = interaction.user.id;


        if (userCreatedChannels.has(userId)) {
            const existingChannel = interaction.guild.channels.cache.get(userCreatedChannels.get(userId));

            if (existingChannel) {
                return interaction.reply({ 
                    content: 'Você já tem uma call ativa! Exclua a call atual ou espere ela ser deletada automaticamente.', 
                    ephemeral: true 
                });
            } else {
                userCreatedChannels.delete(userId);
            }
        }

        const userLimit = parseInt(interaction.values[0], 10);

        try {
            const category = interaction.guild.channels.cache.get(CATEGORY_ID);
            if (!category || category.type !== ChannelType.GuildCategory) {
                return interaction.reply({ content: 'Categoria inválida ou não encontrada. Verifique o ID da categoria.', ephemeral: true });
            }

            channelCounter++;

            const voiceChannel = await interaction.guild.channels.create({
                name: `🔊 Canal - ${channelCounter}`,
                type: ChannelType.GuildVoice,
                parent: CATEGORY_ID,
                userLimit,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
                    },
                ],
            });

            // Registrar o canal criado
            userCreatedChannels.set(userId, voiceChannel.id);

            await interaction.reply({ 
                content: `Canal de voz criado com ${userLimit} espaços: ${voiceChannel}`, 
                ephemeral: true 
            });

            const interval = setInterval(() => {
                if (voiceChannel.members.size === 0) {
                    voiceChannel.delete()
                        .then(() => {
                            userCreatedChannels.delete(userId);
                            clearInterval(interval);
                        })
                        .catch(console.error);
                }
            }, 5000);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Erro ao criar o canal de voz.', ephemeral: true });
        }
    }
});

client.login('Token_do_bot_aqui');
